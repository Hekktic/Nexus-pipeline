# Nexus Pipeline

Next.js (App Router) + Supabase. One shared password gates the whole app —
no individual accounts, no email, no roles. Everyone who knows the password
gets both screens:

| Screen       | What it's for                                                              |
| ------------ | --------------------------------------------------------------------------- |
| `/log`       | A form to add a brand or creator, with fields specific to each              |
| `/pipeline`  | Every brand and creator, filterable — update status, add call notes         |

Brands and creators are separate tables with different fields (see Schema
below) rather than one generic "entry" — a brand doesn't have a vetting
status, and a creator doesn't have a website.

"Logged by" is a plain typed name — nobody has an account, so nothing
verifies who's actually typing.

## Setup

**1. Install** (Node 18.18+ required)

```bash
npm install
```

**2. Database** — create a new Supabase project, open its SQL editor, and
run the whole of [`supabase/schema.sql`](supabase/schema.sql). It creates
the tables, their indexes, the `updated_at` triggers, and Row Level Security
policies that allow full read/write to the anon key. Safe to re-run.

If this project still has the old Phase 1 single `entries` table, this same
script also migrates it in place — it copies each row into `brands` or
`creators` based on its `type`, without dropping `entries`. Once you've
checked the data landed correctly, drop it yourself:

```sql
drop table public.entries;
```

**3. Credentials** — copy `.env.local.example` to `.env.local` and fill in:

```
APP_PASSWORD=choose-a-shared-password
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

The Supabase values are under *Project Settings → API* — use the
**anon / public** key, not the service_role key.

**4. Run**

```bash
npm run dev
```

Sign in at `http://localhost:3000` with the password from `APP_PASSWORD`.

## Auth model

There is no Supabase Auth. Signing in checks the submitted password against
`APP_PASSWORD` (constant-time compare) and, if it matches, sets an httpOnly
cookie holding a SHA-256 hash of that password. `middleware.js` checks that
cookie on every request and redirects signed-out visitors to `/login`.

The server talks to Supabase using the **anon/publishable key** — safe to
treat as public, since the Row Level Security policies in
`supabase/schema.sql` grant that key full read/write on both tables. The
shared password is the actual access control, not RLS; there's no per-user
identity to scope database rows by.

## Schema

`brands` — `id`, `name`, `contact`, `website`, `category`, `margin_notes`,
`fulfillment_notes`, `status` (`prospect` | `discovery_call` | `pilot` |
`active` | `paused` | `churned`, default `prospect`), `logged_by`,
`created_at`, `updated_at`

`creators` — `id`, `name`, `contact`, `platforms` (jsonb, platform name ->
follower count), `category`, `audience_demographics`,
`pricing_expectations`, `vetting_status` (`not_reviewed` | `reviewing` |
`verified` | `rejected`, default `not_reviewed`), `onboarding_status`
(`applied` | `contacted` | `negotiating` | `onboarded` | `active` |
`inactive`, default `applied`), `logged_by`, `created_at`, `updated_at`

`call_logs` — `id`, `subject_type` (`brand` | `creator`), `subject_id`,
`text`, `created_at`. `subject_type`/`subject_id` point at either table —
there's no cross-table foreign key in Postgres for that, so it's enforced
in the server actions instead.

## Structure

```
app/
  page.js               redirects to /log
  actions.js            server actions: login, sign out, create brand,
                         create creator, update statuses, add call log
  login/                shared-password form
  log/                  brand/creator capture screen
  pipeline/             filterable pipeline + call notes
components/             LogForm, PipelineView, PipelineCard, AppShell, ...
lib/
  session.js            password check + cookie token (Node runtime)
  session-edge.js        same token, computed with Web Crypto (Edge runtime,
                         used by middleware.js)
  constants.js           status option sets, timeAgo
  supabase/              server-only client (anon key)
middleware.js           checks the session cookie, guards signed-out access
supabase/schema.sql     tables, indexes, triggers, RLS policies, Phase 1
                        migration
```
