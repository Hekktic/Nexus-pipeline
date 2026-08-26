-- =============================================================================
-- Nexus Pipeline — Supabase schema
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Safe to re-run: everything is create-if-not-exists / create-or-replace.
--
-- There is no Supabase Auth involved. The app is gated by a single shared
-- password (APP_PASSWORD) checked at the Next.js layer, and the server talks
-- to Supabase with the service role key, which bypasses RLS entirely — so
-- RLS is left off below. Do not expose the service role key to the browser.
-- =============================================================================

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
  logged_by   text,
  assigned_to text,
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
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references public.entries (id) on delete cascade,
  author_name text,
  note        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists call_logs_entry_id_idx on public.call_logs (entry_id, created_at desc);

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

-- Row Level Security stays off: the service role key (server-only) is the
-- only credential the app ever uses, and it bypasses RLS regardless.
alter table public.entries   disable row level security;
alter table public.call_logs disable row level security;
