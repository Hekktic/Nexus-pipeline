import { signOut } from "@/app/actions";

/**
 * Reached when a signed-in user has no profile row at all — the schema trigger
 * is missing, or RLS blocked the self-heal insert. Without this the role
 * redirects would ping-pong.
 */
export default function NoRoleNotice({ email }) {
  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900 px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Nexus Pipeline
        </h1>
        <p className="text-xs text-slate-400">No role assigned yet</p>
      </div>
      <div className="space-y-3 p-5 text-sm text-slate-300">
        <p>
          You&apos;re signed in as{" "}
          <span className="text-slate-100">{email}</span>, but there&apos;s no
          profile row for this account, so there&apos;s nothing to show yet.
        </p>
        <p className="text-slate-400">
          An admin can fix it by running{" "}
          <code className="rounded bg-slate-900 px-1 py-0.5 text-xs text-slate-200">
            supabase/schema.sql
          </code>{" "}
          in the SQL editor, then setting the role:
        </p>
        <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200">
{`update public.profiles
   set role = 'logger'  -- or 'closer'
 where email = '${email}';`}
        </pre>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs text-slate-400 underline hover:text-slate-200"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
