# Nexus Pipeline

Next.js (App Router) + Supabase. One shared password gates the whole app —
no individual accounts, no email, no roles. Everyone who knows the password
gets both screens:

| Screen       | What it's for                                                              |
| ------------ | --------------------------------------------------------------------------- |
| `/log`       | A form to add entries (type, name, contact, category, detail, notes, logged by) |
| `/pipeline`  | Every entry, filterable — change status, set an assigned closer, add call notes |

"Logged by" and "Assigned closer" are plain typed names — nobody has an
account, so nothing verifies who's actually typing.

## Setup

**1. Install** (Node 18.18+ required)

```bash
npm install
```

**2. Database** — create a new Supabase project, open its SQL editor, and
run the whole of [`supabase/schema.sql`](supabase/schema.sql). It creates
the two tables, their indexes, the `updated_at` triggers, and Row Level
Security policies that allow full read/write to the anon key. Safe to
re-run.

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

`entries` — `id`, `type` (`creator` | `brand`), `name`, `contact`,
`category`, `detail`, `notes`, `status` (eight values, default `new`),
`logged_by` (text), `assigned_to` (text), `created_at`, `updated_at`

`call_logs` — `id`, `entry_id`, `text`, `created_at`

## Structure

```
app/
  page.js               redirects to /log
  actions.js            server actions: login, sign out, create entry,
                         update status, set assignee, add call log
  login/                shared-password form
  log/                  entry capture screen
  pipeline/             filterable pipeline + call notes
components/             LogForm, PipelineView, PipelineCard, AppShell, ...
lib/
  session.js            password check + cookie token (Node runtime)
  session-edge.js        same token, computed with Web Crypto (Edge runtime,
                         used by middleware.js)
  constants.js           statuses, timeAgo
  supabase/              server-only client (anon key)
middleware.js           checks the session cookie, guards signed-out access
supabase/schema.sql     tables, indexes, triggers, RLS policies
```
