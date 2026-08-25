# Nexus Pipeline

Next.js (App Router) + Supabase rebuild of the localStorage prototype. Magic-link
auth, a role stored on `profiles`, and two screens behind it:

| Role     | Sees                                                                        |
| -------- | --------------------------------------------------------------------------- |
| `logger` | A form to add entries (type, name, contact, category, detail, notes)         |
| `closer` | Every entry, filterable — change status, assign themselves, add call notes   |
| `admin`  | Both screens                                                                 |

The split is enforced in three places: the route guards, the server actions, and
Row Level Security. A logger cannot change a status even by hand-crafting a
request.

## Setup

**1. Install** (Node 18.18+ required)

```bash
npm install
```

**2. Database** — open the Supabase SQL editor and run the whole of
[`supabase/schema.sql`](supabase/schema.sql). It creates the three tables,
their indexes, the `updated_at` triggers, a trigger that gives every new signup
a `profiles` row, and all the RLS policies. It's safe to re-run.

**3. Credentials** — copy `.env.local.example` to `.env.local` and fill in the
two values from *Project Settings → API*:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**4. Auth redirect URLs** — in *Authentication → URL Configuration*, set Site URL
to `http://localhost:3000` and add these to Redirect URLs:

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
```

Add the production equivalents before you deploy.

**5. Run**

```bash
npm run dev
```

Sign in at `http://localhost:3000`. The first sign-in creates the account as a
**logger**. To make someone a closer:

```sql
update public.profiles set role = 'closer' where email = 'them@company.com';
```

## Magic links (optional hardening)

Out of the box the default Supabase email template works — it returns to
`/auth/callback` with a PKCE code. Some corporate mail scanners pre-fetch links
and burn the code before the person clicks. If you hit that, change the Magic
Link template (*Authentication → Email Templates*) to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Sign in to Nexus Pipeline
</a>
```

`/auth/confirm` is already implemented and handles that flow.

Supabase's built-in SMTP is rate limited to a handful of emails per hour — wire
up your own SMTP provider before a team of loggers starts using this.

## Schema

`profiles` — `id` (FK to `auth.users`), `email`, `full_name`, `role`
(`logger` | `closer` | `admin`, default `logger`), `created_at`

`entries` — `id`, `type` (`creator` | `brand`), `name`, `contact`, `category`,
`detail`, `notes`, `status` (the prototype's eight values, default `new`),
`logged_by`, `assigned_to`, `created_at`, `updated_at`

`call_logs` — `id`, `entry_id`, `author_id`, `note`, `created_at`

The brief's column list didn't come through, so this is the schema the app
queries. If your existing tables differ, the query shapes to update are the
`SELECT` in [`app/pipeline/page.js`](app/pipeline/page.js) and the inserts in
[`app/actions.js`](app/actions.js).

## Structure

```
app/
  page.js               role-based redirect
  actions.js            server actions (create entry, status, assign, call log)
  login/                magic-link form
  auth/callback         PKCE code exchange
  auth/confirm          token_hash verification
  log/                  logger screen
  pipeline/             closer screen
components/             LogForm, PipelineView, PipelineCard, AppShell, ...
lib/
  auth.js               session + profile + role helpers
  constants.js          statuses, timeAgo (shared with the prototype)
  supabase/             browser / server / middleware clients
middleware.js           refreshes the session cookie, guards signed-out access
supabase/schema.sql     tables, triggers, RLS
```

## Differences from the prototype

- "Logged by" is no longer a free-text field — it's the signed-in user.
- Call notes live in their own table with an author and a timestamp, instead of
  a JSON array on the entry.
- Statuses, colors, labels, field structure, and layout are carried over as-is.
- Added an "assigned to me" filter, since closers now claim their own work.
