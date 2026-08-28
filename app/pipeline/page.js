import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import DealsListView from "@/components/DealsListView";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();
  const [
    { data: deals, error: dealsError },
    { data: brands, error: brandsError },
    { data: creators, error: creatorsError },
    { data: teamMembers },
  ] = await Promise.all([
    supabase
      .from("deals")
      .select("*, owner:team_members!deals_owner_id_fkey ( id, display_name )")
      .order("updated_at", { ascending: false }),
    // Fetched without the is_archived filter — a deal against a brand/creator
    // that's since been archived should still show up here with its name,
    // not disappear. The "create a deal" picker below reuses this same list,
    // so archived contacts stay pickable too (rare, but not wrong).
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("creators").select("id, name").order("name"),
    supabase.from("team_members").select("id, display_name").eq("is_active", true).order("display_name"),
  ]);

  const error = dealsError || brandsError || creatorsError;

  if (error) {
    return (
      <AppShell active="/pipeline" subtitle="Sales pipeline">
        <p className="text-sm text-red-400">Couldn&apos;t load the pipeline: {error.message}</p>
      </AppShell>
    );
  }

  const brandsById = new Map((brands ?? []).map((b) => [b.id, b]));
  const creatorsById = new Map((creators ?? []).map((c) => [c.id, c]));

  const dealsWithSubject = (deals ?? [])
    .map((d) => {
      const subject = d.subject_type === "brand" ? brandsById.get(d.subject_id) : creatorsById.get(d.subject_id);
      return { ...d, subject: subject ? { id: subject.id, name: subject.name } : null };
    })
    // A deal whose brand/creator row is gone entirely has nothing to show — skip it
    // rather than render a broken row.
    .filter((d) => d.subject);

  return (
    <AppShell active="/pipeline" subtitle="Sales pipeline">
      <DealsListView
        deals={dealsWithSubject}
        brands={brands ?? []}
        creators={creators ?? []}
        teamMembers={teamMembers ?? []}
      />
    </AppShell>
  );
}
