-- Moncy Reddy Wellness — one shared cloud record for no-login, cross-browser sync.
-- Run once in Supabase Dashboard > SQL Editor for the project in supabase-config.js.
-- Every browser reads/writes the same id=1 row. This intentionally uses the anon role;
-- do not use this pattern for private health data on a public website.

create table if not exists public.wellness_state (
  id integer primary key default 1 check (id = 1),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.wellness_state enable row level security;
revoke all on table public.wellness_state from anon, authenticated;
grant select, insert, update on table public.wellness_state to anon, authenticated;

drop policy if exists "Shared wellness state readable by site visitors" on public.wellness_state;
drop policy if exists "Shared wellness state insertable by site visitors" on public.wellness_state;
drop policy if exists "Shared wellness state updateable by site visitors" on public.wellness_state;

create policy "Shared wellness state readable by site visitors"
  on public.wellness_state for select to anon, authenticated using (true);
create policy "Shared wellness state insertable by site visitors"
  on public.wellness_state for insert to anon, authenticated with check (id = 1);
create policy "Shared wellness state updateable by site visitors"
  on public.wellness_state for update to anon, authenticated using (id = 1) with check (id = 1);

-- Enable Supabase Realtime for this table so changes appear in open browsers.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wellness_state'
  ) then
    alter publication supabase_realtime add table public.wellness_state;
  end if;
end $$;

-- Seed the single shared row only if it does not already exist; existing data is preserved.
insert into public.wellness_state (id, state)
values (1, '{}'::jsonb)
on conflict (id) do nothing;
