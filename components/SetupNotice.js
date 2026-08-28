export default function SetupNotice() {
  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 bg-neutral-900 px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Nexus Pipeline
        </h1>
        <p className="text-xs text-neutral-400">Finish setup to continue</p>
      </div>
      <div className="space-y-3 p-5 text-sm text-neutral-300">
        <p>Required environment variables are missing. Create a file named</p>
        <pre className="overflow-x-auto rounded-md border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-200">
{`.env.local

APP_PASSWORD=choose-a-shared-password
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key`}
        </pre>
        <p className="text-neutral-400">
          The Supabase values are in the dashboard under{" "}
          <span className="text-neutral-200">Project Settings → API</span> — use the{" "}
          <span className="text-neutral-200">anon / public</span> key. Restart the
          dev server after saving.
        </p>
      </div>
    </div>
  );
}
