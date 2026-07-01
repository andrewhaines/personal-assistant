import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getImportantUnread, type EmailSummary } from './gmail';
import { getUpcomingEvents, type CalendarEvent } from './calendar';

async function getConnectedAccounts(): Promise<{ id: string; google_email: string }[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('google_accounts').select('id, google_email');
  return data ?? [];
}

export async function getImportantEmailsAcrossAccounts(
  options: { maxResults?: number } = {}
): Promise<EmailSummary[]> {
  const accounts = await getConnectedAccounts();

  const results = await Promise.all(
    accounts.map(account =>
      getImportantUnread(account.id, account.google_email, options).catch(() => [])
    )
  );

  return results
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getUpcomingEventsAcrossAccounts(
  options: { daysAhead?: number } = {}
): Promise<CalendarEvent[]> {
  const accounts = await getConnectedAccounts();

  const results = await Promise.all(
    accounts.map(account =>
      getUpcomingEvents(account.id, account.google_email, options).catch(() => [])
    )
  );

  return results
    .flat()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
