import type Anthropic from '@anthropic-ai/sdk';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import {
  getImportantEmailsAcrossAccounts,
  getUpcomingEventsAcrossAccounts,
} from '@/lib/google/aggregate';

export const tools: Anthropic.Tool[] = [
  {
    name: 'get_tasks',
    description:
      "Get the user's task list. Call this whenever the user asks what they should be doing, what's on their plate, or asks about deadlines or to-dos.",
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'done', 'all'],
          description:
            "Filter by status. 'open' (default) includes open and in-progress tasks; 'done' includes completed tasks; 'all' includes everything.",
        },
        due_before: {
          type: 'string',
          description: 'ISO 8601 timestamp; only return tasks due before this time.',
        },
      },
    },
  },
  {
    name: 'get_upcoming_events',
    description:
      "Get the user's upcoming calendar events across all connected Google accounts. Call this whenever the user asks what's coming up, whether they have gaps or conflicts in their schedule, or what today or this week looks like.",
    input_schema: {
      type: 'object',
      properties: {
        days_ahead: {
          type: 'number',
          description: 'How many days ahead to look. Defaults to 7.',
        },
      },
    },
  },
  {
    name: 'get_important_emails',
    description:
      "Get the user's important/unread emails across all connected Gmail accounts. Call this whenever the user asks about their inbox, what needs a response, or what they might be missing in email.",
    input_schema: {
      type: 'object',
      properties: {
        max_results: {
          type: 'number',
          description: 'Max number of emails to return per account. Defaults to 15.',
        },
      },
    },
  },
];

type ToolInput = Record<string, unknown>;

async function executeGetTasks(input: ToolInput) {
  const supabase = await createSupabaseServerClient();
  const status = (input.status as string) ?? 'open';

  let query = supabase
    .from('tasks')
    .select('*')
    .order('due_at', { ascending: true, nullsFirst: false });

  if (status === 'open') {
    query = query.in('status', ['open', 'in_progress']);
  } else if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (input.due_before) {
    query = query.lte('due_at', input.due_before as string);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { tasks: data };
}

async function executeGetUpcomingEvents(input: ToolInput) {
  const events = await getUpcomingEventsAcrossAccounts({
    daysAhead: (input.days_ahead as number) ?? 7,
  });
  return { events };
}

async function executeGetImportantEmails(input: ToolInput) {
  const emails = await getImportantEmailsAcrossAccounts({
    maxResults: (input.max_results as number) ?? 15,
  });
  return { emails };
}

export const toolExecutors: Record<string, (input: ToolInput) => Promise<unknown>> = {
  get_tasks: executeGetTasks,
  get_upcoming_events: executeGetUpcomingEvents,
  get_important_emails: executeGetImportantEmails,
};
