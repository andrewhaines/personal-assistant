import Anthropic from '@anthropic-ai/sdk';
import { tools, toolExecutors } from './tools';

const client = new Anthropic();
const MODEL = 'claude-sonnet-5';
const MAX_ITERATIONS = 6;
const SYSTEM_PROMPT =
  "You are a personal assistant. Be concise and helpful. Use the available tools to ground your answers in the user's real tasks, calendar, and email instead of guessing, and proactively flag scheduling gaps or conflicts you notice.";

export async function runAssistantTurn(
  messages: Anthropic.MessageParam[]
): Promise<string> {
  const conversation: Anthropic.MessageParam[] = [...messages];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages: conversation,
    });

    if (response.stop_reason !== 'tool_use') {
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );
      return textBlock?.text ?? '';
    }

    conversation.push({ role: 'assistant', content: response.content });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    const toolResults = await Promise.all(
      toolUseBlocks.map(async block => {
        const executor = toolExecutors[block.name];
        const result = executor
          ? await executor(block.input as Record<string, unknown>)
          : { error: `Unknown tool: ${block.name}` };

        return {
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      })
    );

    conversation.push({ role: 'user', content: toolResults });
  }

  return "I wasn't able to finish gathering everything I needed for that — try asking again.";
}
