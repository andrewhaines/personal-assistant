import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: 'You are a personal assistant. Be concise and helpful.',
    messages,
  });

  return Response.json({ content: response.content[0].type === 'text' ? response.content[0].text : '' });
}