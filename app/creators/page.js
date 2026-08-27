import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import CreatorsListView from "@/components/CreatorsListView";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { groupTagsBySubject } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();
  const [{ data: creators, error }, { data: contactTags }] = await Promise.all([
    supabase
      .from("creators")
      .select("*, owner:team_members!creators_owner_id_fkey ( id, display_name )")
      .order("updated_at", { ascending: false }),
    supabase.from("contact_tags").select("id, subject_type, subject_id, tag:tags ( id, name )").eq("subject_type", "creator"),
  ]);

  const tagsBySubject = groupTagsBySubject(contactTags);
  const creatorsWithTags = (creators ?? []).map((c) => ({ ...c, tags: tagsBySubject.get(`creator:${c.id}`) ?? [] }));

  return (
    <AppShell subtitle="Dedicated creator profiles">
      {error ? (
        <p className="text-sm text-red-400">Couldn&apos;t load creators: {error.message}</p>
      ) : (
        <CreatorsListView creators={creatorsWithTags} />
      )}
    </AppShell>
  );
}
