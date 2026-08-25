-- =============================================================================
-- Nexus Pipeline — Supabase schema
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Safe to re-run: everything is create-if-not-exists / create-or-replace.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user, carries the role that drives the whole app
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'logger'
             check (role in ('logger', 'closer', 'admin')),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- entries: a logged creator or brand moving through the pipeline
-- -----------------------------------------------------------------------------
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('creator', 'brand')),
  name        text not null,
  contact     text not null,
  category    text,
  detail      text,
  notes       text,
  status      text not null default 'new'
              check (status in ('new', 'contacted', 'negotiating', 'pilot',
                                'active', 'paused', 'won', 'lost')),
  logged_by   uuid references public.profiles (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists entries_status_idx      on public.entries (status);
create index if not exists entries_type_idx        on public.entries (type);
create index if not exists entries_assigned_to_idx on public.entries (assigned_to);
create index if not exists entries_updated_at_idx  on public.entries (updated_at desc);

-- -----------------------------------------------------------------------------
-- call_logs: append-only notes a closer adds to an entry
-- -----------------------------------------------------------------------------
create table if not exists public.call_logs (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.entries (id) on delete cascade,
  author_id  uuid references public.profiles (id) on delete set null,
  note       text not null,
  created_at timestamptz not null default now()
);

create index if not exists call_logs_entry_id_idx on public.call_logs (entry_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Helper: the calling user's role, readable from inside RLS policies without
-- recursing back through the profiles policies.
-- -----------------------------------------------------------------------------
create or replace function public.user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- -----------------------------------------------------------------------------
-- Auto-create a profile whenever someone signs up (magic link included).
-- New users land as 'logger'; promote closers by hand (see README).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'logger'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already existed before this ran.
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, split_part(u.email, '@', 1), 'logger'
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Keep entries.updated_at honest — the pipeline sorts on it.
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists entries_touch_updated_at on public.entries;
create trigger entries_touch_updated_at
  before update on public.entries
  for each row execute function public.touch_updated_at();

-- A new call note counts as activity on the entry.
create or replace function public.touch_entry_on_call_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.entries set updated_at = now() where id = new.entry_id;
  return new;
end;
$$;

drop trigger if exists call_logs_touch_entry on public.call_logs;
create trigger call_logs_touch_entry
  after insert on public.call_logs
  for each row execute function public.touch_entry_on_call_log();

-- =============================================================================
-- Row Level Security
-- The role split is enforced here, not just in the UI — a logger cannot change
-- a status even if they hand-craft the request.
-- =============================================================================
alter table public.profiles  enable row level security;
alter table public.entries   enable row level security;
alter table public.call_logs enable row level security;

-- profiles -------------------------------------------------------------------
drop policy if exists "profiles readable by authenticated" on public.profiles;
create policy "profiles readable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Self-heal path for a user whose profile row is somehow missing. The check
-- pins the role to 'logger' so nobody can insert themselves as a closer.
drop policy if exists "insert own profile as logger" on public.profiles;
create policy "insert own profile as logger"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid() and role = 'logger');

-- Users may edit their own name, but not their own role.
drop policy if exists "update own profile without role change" on public.profiles;
create policy "update own profile without role change"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.user_role());

-- entries --------------------------------------------------------------------
drop policy if exists "entries readable by authenticated" on public.entries;
create policy "entries readable by authenticated"
  on public.entries for select
  to authenticated
  using (true);

drop policy if exists "loggers and closers can add entries" on public.entries;
create policy "loggers and closers can add entries"
  on public.entries for insert
  to authenticated
  with check (
    logged_by = auth.uid()
    and public.user_role() in ('logger', 'closer', 'admin')
  );

drop policy if exists "closers can update entries" on public.entries;
create policy "closers can update entries"
  on public.entries for update
  to authenticated
  using (public.user_role() in ('closer', 'admin'))
  with check (public.user_role() in ('closer', 'admin'));

drop policy if exists "admins can delete entries" on public.entries;
create policy "admins can delete entries"
  on public.entries for delete
  to authenticated
  using (public.user_role() = 'admin');

-- call_logs ------------------------------------------------------------------
drop policy if exists "call logs readable by authenticated" on public.call_logs;
create policy "call logs readable by authenticated"
  on public.call_logs for select
  to authenticated
  using (true);

drop policy if exists "closers can add call logs" on public.call_logs;
create policy "closers can add call logs"
  on public.call_logs for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.user_role() in ('closer', 'admin')
  );

-- =============================================================================
-- Promote someone to closer:
--   update public.profiles set role = 'closer' where email = 'them@company.com';
-- =============================================================================
