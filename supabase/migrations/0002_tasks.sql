create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  title text not null,
  notes text,
  due_at timestamptz,
  priority smallint not null default 2, -- 1=high, 2=medium, 3=low
  status text not null default 'open',  -- 'open' | 'in_progress' | 'done' | 'cancelled'
  completed_at timestamptz,
  source text,                          -- e.g. 'manual', later 'email:<id>'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_due_idx on tasks (user_id, due_at);
create index tasks_user_status_idx on tasks (user_id, status);

alter table tasks enable row level security;

create policy tasks_owner on tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
