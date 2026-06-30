'use client';
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Personal Assistant</h1>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
            <div className="text-xs text-gray-500 mb-1">{m.role === 'user' ? 'You' : 'Assistant'}</div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {loading && <div className="text-gray-400 italic">Thinking...</div>}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
          Send
        </button>
      </form>
    </div>
  );
}