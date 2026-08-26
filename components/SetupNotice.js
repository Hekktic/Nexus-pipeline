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
        <p>Required environment variables are missing. Create a file named</p>
        <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200">
{`.env.local

APP_PASSWORD=choose-a-shared-password
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
        </pre>
        <p className="text-slate-400">
          The Supabase values are in the dashboard under{" "}
          <span className="text-slate-200">Project Settings → API</span> — use the{" "}
          <span className="text-slate-200">service_role</span> key, not the anon
          key. Restart the dev server after saving.
        </p>
      </div>
    </div>
  );
}
