import AppShell from "@/components/AppShell";
import PipelineView from "@/components/PipelineView";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  if (!hasSupabaseEnv) return <SetupNotice />;

  const supabase = createClient();
  const [
    { data: brands, error: brandsError },
    { data: creators, error: creatorsError },
    { data: callLogs, error: callLogsError },
  ] = await Promise.all([
    supabase.from("brands").select("*").order("updated_at", { ascending: false }),
    supabase.from("creators").select("*").order("updated_at", { ascending: false }),
    supabase.from("call_logs").select("*").order("created_at", { ascending: false }),
  ]);

  const error = brandsError || creatorsError || callLogsError;

  if (error) {
    return (
      <AppShell active="/pipeline" subtitle="Every brand and creator">
        <p className="text-sm text-red-400">
          Couldn&apos;t load the pipeline: {error.message}
        </p>
      </AppShell>
    );
  }

  const logsBySubject = new Map();
  for (const log of callLogs ?? []) {
    const key = `${log.subject_type}:${log.subject_id}`;
    if (!logsBySubject.has(key)) logsBySubject.set(key, []);
    logsBySubject.get(key).push(log);
  }

  const entries = [
    ...(brands ?? []).map((b) => ({
      ...b,
      kind: "brand",
      call_logs: logsBySubject.get(`brand:${b.id}`) ?? [],
    })),
    ...(creators ?? []).map((c) => ({
      ...c,
      kind: "creator",
      call_logs: logsBySubject.get(`creator:${c.id}`) ?? [],
    })),
  ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  return (
    <AppShell active="/pipeline" subtitle="Every brand and creator">
      <PipelineView entries={entries} />
    </AppShell>
  );
}
