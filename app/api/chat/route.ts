import { createSupabaseServerClient } from '@/lib/supabase-server';
import { runAssistantTurn } from '@/lib/assistant/briefing';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { messages } = await req.json();

  const assistantMessage = await runAssistantTurn(messages);

  const latest = messages[messages.length - 1];
  await supabase.from('conversations').insert([
    { role: 'user', content: latest.content },
    { role: 'assistant', content: assistantMessage },
  ]);

  return Response.json({ content: assistantMessage });
}
