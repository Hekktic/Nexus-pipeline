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
-- team_members: a simple roster for ownership fields (Contacts, Deals,
-- Campaigns, Tasks). Not tied to login — there's still only the one shared
-- password — this just gives "who's responsible for this" a real list
-- instead of freeform text, so it's ready for real per-user auth later.
-- Created first since brands/creators reference it via owner_id.
-- -----------------------------------------------------------------------------
create table if not exists public.team_members (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  role         text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists team_members_is_active_idx on public.team_members (is_active);

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

-- Richer brand profile fields (Phase 2). All additive/nullable — no existing
-- data is touched. `category` already covers "industry/category" and
-- `website` already covers "Shopify or storefront URL" from the spec, so
-- neither is duplicated here.
alter table public.brands add column if not exists primary_contact_name  text;
alter table public.brands add column if not exists contact_title         text;
alter table public.brands add column if not exists email                 text;
alter table public.brands add column if not exists phone                 text;
alter table public.brands add column if not exists products              text;
alter table public.brands add column if not exists avg_product_price     numeric;
alter table public.brands add column if not exists target_customer       text;
alter table public.brands add column if not exists preferred_niches      text;
alter table public.brands add column if not exists preferred_platforms   text;
alter table public.brands add column if not exists campaign_objectives   text;
alter table public.brands add column if not exists budget                text;
alter table public.brands add column if not exists commission_range      text;
alter table public.brands add column if not exists sample_availability   text;
alter table public.brands add column if not exists notes                 text;
alter table public.brands add column if not exists owner_id              uuid references public.team_members (id) on delete set null;
alter table public.brands add column if not exists last_contact_date     date;
alter table public.brands add column if not exists next_follow_up_date   date;
alter table public.brands add column if not exists estimated_deal_value  numeric;

-- Contacts upgrade (Phase 2, part 2): preferred contact method, follow-up
-- priority, a social-links map (mirrors creators.platform_links), and
-- archiving — hiding a brand from active views without deleting it.
alter table public.brands add column if not exists preferred_contact_method text;
alter table public.brands add column if not exists follow_up_priority       text
                          check (follow_up_priority is null or follow_up_priority in ('low', 'medium', 'high'));
alter table public.brands add column if not exists social_links             jsonb not null default '{}'::jsonb;
alter table public.brands add column if not exists is_archived              boolean not null default false;

create index if not exists brands_owner_id_idx            on public.brands (owner_id);
create index if not exists brands_next_follow_up_date_idx on public.brands (next_follow_up_date);
create index if not exists brands_is_archived_idx         on public.brands (is_archived);

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

-- Richer creator profile fields (Phase 2). All additive/nullable — no
-- existing data is touched. `category` already covers "primary niche" and
-- `platforms` already covers per-platform follower counts, so neither is
-- duplicated here; `platform_links` is a separate map for profile URLs
-- since a creator's follower count and profile link are tracked at
-- different times in practice.
alter table public.creators add column if not exists location                      text;
alter table public.creators add column if not exists age_confirmed                 boolean;
alter table public.creators add column if not exists primary_platform              text;
alter table public.creators add column if not exists platform_links                jsonb not null default '{}'::jsonb;
alter table public.creators add column if not exists secondary_niches              text;
alter table public.creators add column if not exists avg_views                     text;
alter table public.creators add column if not exists engagement_rate               text;
alter table public.creators add column if not exists content_style                 text;
alter table public.creators add column if not exists previous_brand_partnerships   text;
alter table public.creators add column if not exists preferred_compensation        text;
alter table public.creators add column if not exists minimum_rate                  text;
alter table public.creators add column if not exists affiliate_interest            boolean;
alter table public.creators add column if not exists sample_interest               boolean;
alter table public.creators add column if not exists availability                  text;
alter table public.creators add column if not exists reliability_rating            smallint check (reliability_rating between 1 and 5);
alter table public.creators add column if not exists brand_safety_notes            text;
alter table public.creators add column if not exists portfolio_url                 text;
alter table public.creators add column if not exists owner_id                      uuid references public.team_members (id) on delete set null;
alter table public.creators add column if not exists last_contact_date             date;
alter table public.creators add column if not exists next_follow_up_date           date;
alter table public.creators add column if not exists total_earnings                numeric;

-- Contacts upgrade (Phase 2, part 2): preferred contact method, follow-up
-- priority, a general notes field (brands already have one), and
-- archiving — hiding a creator from active views without deleting it.
alter table public.creators add column if not exists preferred_contact_method text;
alter table public.creators add column if not exists follow_up_priority       text
                            check (follow_up_priority is null or follow_up_priority in ('low', 'medium', 'high'));
alter table public.creators add column if not exists notes                    text;
alter table public.creators add column if not exists is_archived              boolean not null default false;

create index if not exists creators_owner_id_idx            on public.creators (owner_id);
create index if not exists creators_next_follow_up_date_idx on public.creators (next_follow_up_date);
create index if not exists creators_is_archived_idx         on public.creators (is_archived);

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
-- tags / contact_tags: free-form labels attachable to a brand or creator.
-- contact_tags is the join table — subject_type/subject_id point at either
-- table, same polymorphic approach as call_logs, checked in application
-- code rather than a cross-table foreign key.
-- -----------------------------------------------------------------------------
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness so "VIP" and "vip" can't both be created.
create unique index if not exists tags_name_lower_idx on public.tags (lower(name));

create table if not exists public.contact_tags (
  id           uuid primary key default gen_random_uuid(),
  tag_id       uuid not null references public.tags (id) on delete cascade,
  subject_type text not null check (subject_type in ('brand', 'creator')),
  subject_id   uuid not null,
  created_at   timestamptz not null default now()
);

create unique index if not exists contact_tags_unique_idx
  on public.contact_tags (tag_id, subject_type, subject_id);
create index if not exists contact_tags_subject_idx
  on public.contact_tags (subject_type, subject_id);

-- -----------------------------------------------------------------------------
-- activities: a log entry for anything worth showing on a brand/creator's
-- timeline besides a call note (creation, status changes, archiving, tags).
-- Call notes themselves stay in call_logs — the timeline view in the app
-- merges the two by created_at rather than duplicating notes in here.
-- -----------------------------------------------------------------------------
create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('brand', 'creator')),
  subject_id   uuid not null,
  type         text not null,
  description  text not null,
  created_at   timestamptz not null default now()
);

create index if not exists activities_subject_idx
  on public.activities (subject_type, subject_id, created_at desc);

-- -----------------------------------------------------------------------------
-- profit_scenarios: saved runs of the Profit Calculator (Quick or Advanced
-- mode). Both the inputs and the calculated outputs are stored — outputs are
-- never kept without the assumptions that produced them, so a saved scenario
-- stays meaningful even after the calculation logic evolves. Optionally
-- linked to a brand and/or creator; campaign linkage comes later, once
-- campaigns exist.
-- -----------------------------------------------------------------------------
create table if not exists public.profit_scenarios (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  mode       text not null check (mode in ('quick', 'advanced')),
  brand_id   uuid references public.brands (id) on delete set null,
  creator_id uuid references public.creators (id) on delete set null,
  inputs     jsonb not null,
  outputs    jsonb not null,
  status     text not null default 'draft' check (status in ('draft', 'archived')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profit_scenarios_brand_id_idx   on public.profit_scenarios (brand_id);
create index if not exists profit_scenarios_creator_id_idx on public.profit_scenarios (creator_id);
create index if not exists profit_scenarios_status_idx     on public.profit_scenarios (status);

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

drop trigger if exists team_members_touch_updated_at on public.team_members;
create trigger team_members_touch_updated_at
  before update on public.team_members
  for each row execute function public.touch_updated_at();

drop trigger if exists profit_scenarios_touch_updated_at on public.profit_scenarios;
create trigger profit_scenarios_touch_updated_at
  before update on public.profit_scenarios
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
alter table public.brands       enable row level security;
alter table public.creators     enable row level security;
alter table public.call_logs    enable row level security;
alter table public.team_members enable row level security;
alter table public.tags         enable row level security;
alter table public.contact_tags enable row level security;
alter table public.activities      enable row level security;
alter table public.profit_scenarios enable row level security;

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

drop policy if exists "team members full access" on public.team_members;
create policy "team members full access"
  on public.team_members for all
  to anon
  using (true)
  with check (true);

drop policy if exists "tags full access" on public.tags;
create policy "tags full access"
  on public.tags for all
  to anon
  using (true)
  with check (true);

drop policy if exists "contact tags full access" on public.contact_tags;
create policy "contact tags full access"
  on public.contact_tags for all
  to anon
  using (true)
  with check (true);

drop policy if exists "activities full access" on public.activities;
create policy "activities full access"
  on public.activities for all
  to anon
  using (true)
  with check (true);

drop policy if exists "profit scenarios full access" on public.profit_scenarios;
create policy "profit scenarios full access"
  on public.profit_scenarios for all
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
