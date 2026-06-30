import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: 'You are a personal assistant. Be concise and helpful.',
    messages,
  });

  const assistantMessage = response.content[0].type === 'text'
    ? response.content[0].text : '';

  // Save the latest user message and assistant reply
  const latest = messages[messages.length - 1];
  await supabase.from('conversations').insert([
    { role: 'user', content: latest.content },
    { role: 'assistant', content: assistantMessage },
  ]);

  return Response.json({ content: assistantMessage });
}