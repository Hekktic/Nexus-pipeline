import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import CreatorsListView from "@/components/CreatorsListView";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();
  const { data: creators, error } = await supabase
    .from("creators")
    .select("*, owner:team_members!creators_owner_id_fkey ( id, display_name )")
    .order("updated_at", { ascending: false });

  return (
    <AppShell subtitle="Dedicated creator profiles">
      {error ? (
        <p className="text-sm text-red-400">Couldn&apos;t load creators: {error.message}</p>
      ) : (
        <CreatorsListView creators={creators ?? []} />
      )}
    </AppShell>
  );
}
