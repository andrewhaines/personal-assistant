import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { exchangeCodeForTokens, getGoogleUserInfo, verifyState } from '@/lib/google/oauth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const settingsUrl = new URL('/settings/accounts', req.url);

  if (errorParam) {
    settingsUrl.searchParams.set('error', errorParam);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !state || !verifyState(state)) {
    settingsUrl.searchParams.set('error', 'invalid_state');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      settingsUrl.searchParams.set('error', 'no_refresh_token');
      return NextResponse.redirect(settingsUrl);
    }

    const { email, sub } = await getGoogleUserInfo(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('google_accounts').upsert(
      {
        google_email: email,
        google_sub: sub,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        access_token_expires_at: expiresAt,
        scopes: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,google_sub' }
    );

    if (error) {
      settingsUrl.searchParams.set('error', 'storage_failed');
      return NextResponse.redirect(settingsUrl);
    }

    settingsUrl.searchParams.set('connected', email);
    return NextResponse.redirect(settingsUrl);
  } catch {
    settingsUrl.searchParams.set('error', 'exchange_failed');
    return NextResponse.redirect(settingsUrl);
  }
}
