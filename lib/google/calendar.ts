import { getCalendarClient } from './client';

export type CalendarEvent = {
  id: string;
  accountEmail: string;
  summary: string;
  start: string;
  end: string;
  location: string;
};

export async function getUpcomingEvents(
  googleAccountId: string,
  accountEmail: string,
  { daysAhead = 7 }: { daysAhead?: number } = {}
): Promise<CalendarEvent[]> {
  const calendar = await getCalendarClient(googleAccountId);

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items ?? []).map(event => ({
    id: event.id ?? '',
    accountEmail,
    summary: event.summary ?? '(no title)',
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    location: event.location ?? '',
  }));
}
