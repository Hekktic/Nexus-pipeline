-- =============================================================================
-- Nexus Pipeline — migration off Supabase Auth
-- Run this ONCE against an existing project that still has the old
-- profiles-based schema. It backfills names from profiles before dropping
-- it, converts the FK columns to free text, and turns RLS off (the app now
-- talks to Supabase with the service role key exclusively, which bypasses
-- RLS anyway). Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add the new free-text columns alongside the old uuid FK columns.
-- -----------------------------------------------------------------------------
alter table public.entries   add column if not exists logged_by_name   text;
alter table public.entries   add column if not exists assigned_to_name text;
alter table public.call_logs add column if not exists author_name      text;

-- -----------------------------------------------------------------------------
-- 2. Backfill from profiles, if that table still exists.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    update public.entries e
    set logged_by_name = coalesce(p.full_name, p.email)
    from public.profiles p
    where p.id = e.logged_by and e.logged_by_name is null;

    update public.entries e
    set assigned_to_name = coalesce(p.full_name, p.email)
    from public.profiles p
    where p.id = e.assigned_to and e.assigned_to_name is null;

    update public.call_logs c
    set author_name = coalesce(p.full_name, p.email)
    from public.profiles p
    where p.id = c.author_id and c.author_name is null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Drop the old uuid FK columns and rename the new ones into their place.
-- -----------------------------------------------------------------------------
alter table public.entries   drop column if exists logged_by;
alter table public.entries   drop column if exists assigned_to;
alter table public.call_logs drop column if exists author_id;

alter table public.entries   rename column logged_by_name   to logged_by;
alter table public.entries   rename column assigned_to_name to assigned_to;

create index if not exists entries_assigned_to_idx on public.entries (assigned_to);

-- -----------------------------------------------------------------------------
-- 4. Drop everything that only existed to support Supabase Auth.
-- -----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.user_role();
drop table if exists public.profiles;

-- -----------------------------------------------------------------------------
-- 5. Turn RLS off — the app now authenticates with the service role key only,
--    which bypasses RLS regardless of policy state.
-- -----------------------------------------------------------------------------
drop policy if exists "entries readable by authenticated" on public.entries;
drop policy if exists "loggers and closers can add entries" on public.entries;
drop policy if exists "closers can update entries" on public.entries;
drop policy if exists "admins can delete entries" on public.entries;
drop policy if exists "call logs readable by authenticated" on public.call_logs;
drop policy if exists "closers can add call logs" on public.call_logs;

alter table public.entries   disable row level security;
alter table public.call_logs disable row level security;
