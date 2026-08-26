# Nexus Pipeline

Next.js (App Router) + Supabase. One shared password gates the whole app —
no individual accounts, no email, no roles. Everyone who knows the password
gets both screens:

| Screen       | What it's for                                                              |
| ------------ | --------------------------------------------------------------------------- |
| `/log`       | A form to add entries (type, name, contact, category, detail, notes)        |
| `/pipeline`  | Every entry, filterable — change status, assign, add call notes             |

"Logged by" / "Assigned to" / call-note author are plain free-text names
people type into a "Your name" field — remembered per browser via
localStorage, not tied to any login.

## Setup

**1. Install** (Node 18.18+ required)

```bash
npm install
```

**2. Database** — open the Supabase SQL editor and run the whole of
[`supabase/schema.sql`](supabase/schema.sql). It creates the two tables,
their indexes, and the `updated_at` triggers. It's safe to re-run.

If this is an **existing** project that still has the old Supabase-Auth
schema (a `profiles` table, uuid columns on `entries`/`call_logs`), run
[`supabase/migrate_drop_auth.sql`](supabase/migrate_drop_auth.sql) instead —
it backfills names from `profiles` before dropping it, then leaves you at
the same end state as `schema.sql`.

**3. Credentials** — copy `.env.local.example` to `.env.local` and fill in:

```
APP_PASSWORD=choose-a-shared-password
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The Supabase values are under *Project Settings → API* — use the
**service_role** key, not the anon key. It's a server-only secret; never put
it behind `NEXT_PUBLIC_`.

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

The server talks to Supabase using the **service role key**, which bypasses
Row Level Security — so RLS is off on both tables. The shared password is the
only access control; there is nothing more granular underneath it.

## Schema

`entries` — `id`, `type` (`creator` | `brand`), `name`, `contact`,
`category`, `detail`, `notes`, `status` (eight values, default `new`),
`logged_by` (text), `assigned_to` (text), `created_at`, `updated_at`

`call_logs` — `id`, `entry_id`, `author_name` (text), `note`, `created_at`

## Structure

```
app/
  page.js               redirects to /log
  actions.js            server actions: login, sign out, create entry,
                         update status, assign, add call log
  login/                shared-password form
  log/                  entry capture screen
  pipeline/             filterable pipeline + call notes
components/             LogForm, PipelineView, PipelineCard, AppShell, ...
lib/
  session.js            password check + cookie token (Node runtime)
  session-edge.js        same token, computed with Web Crypto (Edge runtime,
                         used by middleware.js)
  localName.js           localStorage "Your name" helper (not auth)
  constants.js           statuses, timeAgo
  supabase/              server-only client (service role key)
middleware.js           checks the session cookie, guards signed-out access
supabase/schema.sql     tables, indexes, triggers
supabase/migrate_drop_auth.sql   one-time migration off the old auth schema
```
