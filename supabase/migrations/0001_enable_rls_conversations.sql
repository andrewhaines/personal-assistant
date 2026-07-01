-- Retrofit row-level security onto the existing `conversations` table.

alter table conversations add column if not exists user_id uuid references auth.users(id);

update conversations
set user_id = 'acee2767-258d-4fc1-9b40-6086977b62be'
where user_id is null;

alter table conversations alter column user_id set not null;
alter table conversations alter column user_id set default auth.uid();

alter table conversations enable row level security;

create policy conversations_owner_select on conversations
  for select using (user_id = auth.uid());

create policy conversations_owner_insert on conversations
  for insert with check (user_id = auth.uid());
