-- =============================================================================
-- Nexus Pipeline — Supabase schema
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Safe to re-run: everything is create-if-not-exists / create-or-replace,
-- and it also works as an in-place upgrade from the Phase 1 (single
-- `entries` table) schema — see the migration block at the bottom.
--
-- There is no Supabase Auth involved. The app is gated by a single shared
-- password (APP_PASSWORD) checked at the Next.js layer. The server talks to
-- Supabase with the anon/publishable key, and since there's no per-user
-- session to scope access by, RLS is enabled but the policies below simply
-- allow full read/write to anyone using that key — the shared password is
-- the only access control.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- brands
-- -----------------------------------------------------------------------------
create table if not exists public.brands (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  contact           text not null,
  website           text,
  category          text,
  margin_notes      text,
  fulfillment_notes text,
  status            text not null default 'prospect'
                    check (status in ('prospect', 'discovery_call', 'pilot',
                                      'active', 'paused', 'churned')),
  logged_by         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists brands_status_idx     on public.brands (status);
create index if not exists brands_updated_at_idx on public.brands (updated_at desc);

-- -----------------------------------------------------------------------------
-- creators
-- -----------------------------------------------------------------------------
create table if not exists public.creators (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  contact                text not null,
  -- Free-form platform -> follower-count pairs, e.g. {"TikTok": "40k", "Instagram": "12k"}.
  platforms              jsonb not null default '{}'::jsonb,
  category               text,
  audience_demographics  text,
  pricing_expectations   text,
  vetting_status         text not null default 'not_reviewed'
                         check (vetting_status in ('not_reviewed', 'reviewing',
                                                   'verified', 'rejected')),
  onboarding_status      text not null default 'applied'
                         check (onboarding_status in ('applied', 'contacted', 'negotiating',
                                                      'onboarded', 'active', 'inactive')),
  logged_by              text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists creators_vetting_status_idx    on public.creators (vetting_status);
create index if not exists creators_onboarding_status_idx on public.creators (onboarding_status);
create index if not exists creators_updated_at_idx        on public.creators (updated_at desc);

-- -----------------------------------------------------------------------------
-- call_logs: append-only notes anyone can add to a brand or creator over
-- time. subject_type/subject_id point at either table — Postgres can't
-- enforce a foreign key across two possible tables, so that's checked in
-- application code instead.
--
-- Built as create-minimal-then-alter so this also upgrades a Phase 1
-- call_logs table (which had `entry_id` pointing at the old `entries`
-- table) in place, backfilling subject_type/subject_id from it.
-- -----------------------------------------------------------------------------
create table if not exists public.call_logs (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  created_at timestamptz not null default now()
);

alter table public.call_logs add column if not exists subject_type text;
alter table public.call_logs add column if not exists subject_id   uuid;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'call_logs' and column_name = 'entry_id')
     and exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'entries') then

    update public.call_logs c
    set subject_type = 'brand', subject_id = c.entry_id
    from public.entries e
    where e.id = c.entry_id and e.type = 'brand' and c.subject_id is null;

    update public.call_logs c
    set subject_type = 'creator', subject_id = c.entry_id
    from public.entries e
    where e.id = c.entry_id and e.type = 'creator' and c.subject_id is null;
  end if;
end $$;

alter table public.call_logs drop column if exists entry_id;
alter table public.call_logs drop column if exists author_name;

alter table public.call_logs alter column subject_type set not null;
alter table public.call_logs alter column subject_id set not null;

alter table public.call_logs drop constraint if exists call_logs_subject_type_check;
alter table public.call_logs add constraint call_logs_subject_type_check
  check (subject_type in ('brand', 'creator'));

create index if not exists call_logs_subject_idx on public.call_logs (subject_type, subject_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Keep updated_at honest — the pipeline sorts on it.
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

drop trigger if exists brands_touch_updated_at on public.brands;
create trigger brands_touch_updated_at
  before update on public.brands
  for each row execute function public.touch_updated_at();

drop trigger if exists creators_touch_updated_at on public.creators;
create trigger creators_touch_updated_at
  before update on public.creators
  for each row execute function public.touch_updated_at();

-- A new call note counts as activity on whichever brand or creator it's on.
create or replace function public.touch_subject_on_call_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.subject_type = 'brand' then
    update public.brands set updated_at = now() where id = new.subject_id;
  else
    update public.creators set updated_at = now() where id = new.subject_id;
  end if;
  return new;
end;
$$;

drop trigger if exists call_logs_touch_subject on public.call_logs;
create trigger call_logs_touch_subject
  after insert on public.call_logs
  for each row execute function public.touch_subject_on_call_log();

-- =============================================================================
-- Row Level Security — enabled, but wide open. There's no per-user identity
-- to restrict by, so anyone holding the anon key (i.e. this app, once past
-- the shared password) can read and write freely.
-- =============================================================================
alter table public.brands    enable row level security;
alter table public.creators  enable row level security;
alter table public.call_logs enable row level security;

drop policy if exists "brands full access" on public.brands;
create policy "brands full access"
  on public.brands for all
  to anon
  using (true)
  with check (true);

drop policy if exists "creators full access" on public.creators;
create policy "creators full access"
  on public.creators for all
  to anon
  using (true)
  with check (true);

drop policy if exists "call logs full access" on public.call_logs;
create policy "call logs full access"
  on public.call_logs for all
  to anon
  using (true)
  with check (true);

-- =============================================================================
-- Stage 1 migration: if this project still has the old single `entries`
-- table from before the brands/creators split, this copies its rows into
-- the right new table based on `type`. It does NOT drop `entries` — do that
-- yourself once you've checked the data landed correctly:
--
--   drop table public.entries;
--
-- Safe to re-run: every insert is keyed off the old row's id, so re-running
-- this after already migrating won't duplicate rows.
-- =============================================================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'entries') then

    insert into public.brands (id, name, contact, website, category, status, logged_by, created_at, updated_at)
    select id, name, contact, detail, category,
           case status
             when 'new' then 'prospect'
             when 'contacted' then 'discovery_call'
             when 'negotiating' then 'discovery_call'
             when 'pilot' then 'pilot'
             when 'active' then 'active'
             when 'paused' then 'paused'
             when 'won' then 'active'
             when 'lost' then 'churned'
             else 'prospect'
           end,
           logged_by, created_at, updated_at
    from public.entries
    where type = 'brand'
    on conflict (id) do nothing;

    insert into public.creators (id, name, contact, category, audience_demographics, logged_by, created_at, updated_at)
    select id, name, contact, category, detail, logged_by, created_at, updated_at
    from public.entries
    where type = 'creator'
    on conflict (id) do nothing;

  end if;
end $$;
