export default function SetupNotice() {
  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900 px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Nexus Pipeline
        </h1>
        <p className="text-xs text-slate-400">Finish setup to continue</p>
      </div>
      <div className="space-y-3 p-5 text-sm text-slate-300">
        <p>Supabase credentials are missing. Create a file named</p>
        <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200">
{`.env.local

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000`}
        </pre>
        <p className="text-slate-400">
          Both values are in the Supabase dashboard under{" "}
          <span className="text-slate-200">Project Settings → API</span>. Restart
          the dev server after saving.
        </p>
      </div>
    </div>
  );
}
