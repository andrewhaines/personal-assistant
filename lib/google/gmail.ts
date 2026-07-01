import { getGmailClient } from './client';

export type EmailSummary = {
  id: string;
  accountEmail: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
};

function headerValue(
  headers: { name?: string | null; value?: string | null }[] | undefined,
  name: string
): string {
  return headers?.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

export async function getImportantUnread(
  googleAccountId: string,
  accountEmail: string,
  { maxResults = 15 }: { maxResults?: number } = {}
): Promise<EmailSummary[]> {
  const gmail = await getGmailClient(googleAccountId);

  let list = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread is:important',
    maxResults,
  });

  if (!list.data.messages || list.data.messages.length === 0) {
    list = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults,
    });
  }

  const messages = list.data.messages ?? [];

  return Promise.all(
    messages.map(async m => {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: m.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });
      const headers = msg.data.payload?.headers ?? undefined;
      return {
        id: m.id!,
        accountEmail,
        from: headerValue(headers, 'From'),
        subject: headerValue(headers, 'Subject'),
        snippet: msg.data.snippet ?? '',
        date: headerValue(headers, 'Date'),
      };
    })
  );
}
