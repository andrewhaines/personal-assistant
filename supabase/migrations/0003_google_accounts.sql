-- Stores OAuth tokens for connected Google accounts (Gmail + Calendar,
-- read-only scopes). Access/refresh tokens must NEVER be queried using the
-- anon/browser Supabase client -- only server-side code (route handlers)
-- should touch this table.

create table google_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  google_email text not null,
  google_sub text not null,
  access_token text not null,
  refresh_token text not null,
  access_token_expires_at timestamptz not null,
  scopes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, google_sub)
);

alter table google_accounts enable row level security;

create policy google_accounts_owner on google_accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
