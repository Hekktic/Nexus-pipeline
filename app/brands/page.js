import AppShell from "@/components/AppShell";
import BrandsListView from "@/components/BrandsListView";
import CenteredScreen from "@/components/CenteredScreen";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { groupTagsBySubject } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();
  const [{ data: brands, error }, { data: contactTags }] = await Promise.all([
    supabase
      .from("brands")
      .select("*, owner:team_members!brands_owner_id_fkey ( id, display_name )")
      .order("updated_at", { ascending: false }),
    supabase.from("contact_tags").select("id, subject_type, subject_id, tag:tags ( id, name )").eq("subject_type", "brand"),
  ]);

  const tagsBySubject = groupTagsBySubject(contactTags);
  const brandsWithTags = (brands ?? []).map((b) => ({ ...b, tags: tagsBySubject.get(`brand:${b.id}`) ?? [] }));

  return (
    <AppShell subtitle="Dedicated brand profiles">
      {error ? (
        <p className="text-sm text-red-400">Couldn&apos;t load brands: {error.message}</p>
      ) : (
        <BrandsListView brands={brandsWithTags} />
      )}
    </AppShell>
  );
}
