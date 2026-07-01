import { google } from 'googleapis';
import { getValidAccessToken } from './oauth';

export async function getGmailClient(googleAccountId: string) {
  const accessToken = await getValidAccessToken(googleAccountId);
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

export async function getCalendarClient(googleAccountId: string) {
  const accessToken = await getValidAccessToken(googleAccountId);
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}
