import AppShell from "@/components/AppShell";
import PipelineView from "@/components/PipelineView";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const SELECT = `
  id, type, name, contact, category, detail, notes, status,
  logged_by, assigned_to, created_at, updated_at,
  call_logs ( id, note, author_name, created_at )
`;

export default async function PipelinePage() {
  if (!hasSupabaseEnv) return <SetupNotice />;

  const supabase = createClient();
  const { data: entries, error } = await supabase
    .from("entries")
    .select(SELECT)
    .order("updated_at", { ascending: false })
    .order("created_at", { referencedTable: "call_logs", ascending: false });

  return (
    <AppShell active="/pipeline" subtitle="Every logged contact">
      {error ? (
        <p className="text-sm text-red-400">
          Couldn&apos;t load the pipeline: {error.message}
        </p>
      ) : (
        <PipelineView entries={entries ?? []} />
      )}
    </AppShell>
  );
}
