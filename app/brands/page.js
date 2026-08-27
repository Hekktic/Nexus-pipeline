import AppShell from "@/components/AppShell";
import BrandsListView from "@/components/BrandsListView";
import CenteredScreen from "@/components/CenteredScreen";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();
  const { data: brands, error } = await supabase
    .from("brands")
    .select("*, owner:team_members!brands_owner_id_fkey ( id, display_name )")
    .order("updated_at", { ascending: false });

  return (
    <AppShell subtitle="Dedicated brand profiles">
      {error ? (
        <p className="text-sm text-red-400">Couldn&apos;t load brands: {error.message}</p>
      ) : (
        <BrandsListView brands={brands ?? []} />
      )}
    </AppShell>
  );
}
