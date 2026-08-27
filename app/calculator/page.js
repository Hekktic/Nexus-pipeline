import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import ProfitCalculator from "@/components/ProfitCalculator";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();

  const [{ data: brands }, { data: creators }, { data: scenarios, error }] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("creators").select("id, name").order("name"),
    supabase
      .from("profit_scenarios")
      .select(
        "*, brand:brands!profit_scenarios_brand_id_fkey ( id, name ), creator:creators!profit_scenarios_creator_id_fkey ( id, name )"
      )
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <AppShell subtitle="Model deals before you present terms">
      {error ? (
        <p className="text-sm text-red-400">Couldn&apos;t load saved scenarios: {error.message}</p>
      ) : (
        <ProfitCalculator brands={brands ?? []} creators={creators ?? []} scenarios={scenarios ?? []} />
      )}
    </AppShell>
  );
}
