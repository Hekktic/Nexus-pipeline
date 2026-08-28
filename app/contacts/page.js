import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import PipelineView from "@/components/PipelineView";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { groupTagsBySubject } from "@/lib/tags";

export const dynamic = "force-dynamic";

/**
 * The general "every brand and creator, searchable" view. /pipeline is the
 * separate sales-deals board — a brand/creator's relationship status lives
 * here; a specific sales opportunity with them is a deal, tracked there.
 */
export default async function ContactsPage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();
  const [
    { data: brands, error: brandsError },
    { data: creators, error: creatorsError },
    { data: callLogs, error: callLogsError },
    { data: contactTags, error: tagsError },
    { data: allTags },
  ] = await Promise.all([
    supabase.from("brands").select("*").eq("is_archived", false).order("updated_at", { ascending: false }),
    supabase.from("creators").select("*").eq("is_archived", false).order("updated_at", { ascending: false }),
    supabase.from("call_logs").select("*").order("created_at", { ascending: false }),
    supabase.from("contact_tags").select("id, subject_type, subject_id, tag:tags ( id, name )"),
    supabase.from("tags").select("name").order("name"),
  ]);

  const error = brandsError || creatorsError || callLogsError || tagsError;

  if (error) {
    return (
      <AppShell subtitle="Every brand and creator">
        <p className="text-sm text-red-400">
          Couldn&apos;t load contacts: {error.message}
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

  const tagsBySubject = groupTagsBySubject(contactTags);

  const entries = [
    ...(brands ?? []).map((b) => ({
      ...b,
      kind: "brand",
      call_logs: logsBySubject.get(`brand:${b.id}`) ?? [],
      tags: tagsBySubject.get(`brand:${b.id}`) ?? [],
    })),
    ...(creators ?? []).map((c) => ({
      ...c,
      kind: "creator",
      call_logs: logsBySubject.get(`creator:${c.id}`) ?? [],
      tags: tagsBySubject.get(`creator:${c.id}`) ?? [],
    })),
  ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  return (
    <AppShell subtitle="Every brand and creator">
      <PipelineView entries={entries} allTagNames={(allTags ?? []).map((t) => t.name)} />
    </AppShell>
  );
}
