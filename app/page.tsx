'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from('conversations')
        .select('role, content')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    }
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();
    setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--bottom-nav-height)-env(safe-area-inset-bottom))] max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Personal Assistant</h1>
      <div className="flex-1 overflow-y-auto scroll-smooth space-y-4 mb-4">
        {messages.map((m, i) => (
          <Card
            key={i}
            className={`animate-fade-in ${m.role === 'user' ? 'ml-8 bg-primary text-primary-foreground' : 'mr-8'}`}
          >
            <CardContent>
              <div
                className={`text-xs mb-1 ${m.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
              >
                {m.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </CardContent>
          </Card>
        ))}
        {loading && <div className="text-muted-foreground italic animate-fade-in">Thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything..."
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}