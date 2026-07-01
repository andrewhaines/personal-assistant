import crypto from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'openid',
  'email',
];

const STATE_MAX_AGE_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 2 * 60 * 1000;

function stateSecret(): string {
  return process.env.OAUTH_STATE_SECRET!;
}

function signState(): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${nonce}.${timestamp}`;
  const signature = crypto.createHmac('sha256', stateSecret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyState(state: string): boolean {
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, timestamp, signature] = parts;
  const payload = `${nonce}.${timestamp}`;
  const expected = crypto.createHmac('sha256', stateSecret()).update(payload).digest('hex');

  const signatureBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (signatureBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return false;

  const age = Date.now() - Number(timestamp);
  return age >= 0 && age < STATE_MAX_AGE_MS;
}

export function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
    state: signState(),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
};

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function getGoogleUserInfo(
  accessToken: string
): Promise<{ email: string; sub: string }> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google userinfo request failed: ${res.status}`);
  }

  const data = await res.json();
  return { email: data.email, sub: data.sub };
}

async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function getValidAccessToken(googleAccountId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data: account, error } = await supabase
    .from('google_accounts')
    .select('access_token, refresh_token, access_token_expires_at')
    .eq('id', googleAccountId)
    .single();

  if (error || !account) {
    throw new Error(`Google account ${googleAccountId} not found`);
  }

  const expiresAt = new Date(account.access_token_expires_at).getTime();
  if (expiresAt - Date.now() > ACCESS_TOKEN_EXPIRY_BUFFER_MS) {
    return account.access_token;
  }

  const refreshed = await refreshAccessToken(account.refresh_token);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from('google_accounts')
    .update({
      access_token: refreshed.access_token,
      access_token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', googleAccountId);

  return refreshed.access_token;
}
