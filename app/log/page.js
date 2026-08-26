import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import LogForm from "@/components/LogForm";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();
  const [{ data: brands }, { data: creators }] = await Promise.all([
    supabase
      .from("brands")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("creators")
      .select("id, name, onboarding_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const recent = [
    ...(brands ?? []).map((b) => ({ ...b, kind: "brand" })),
    ...(creators ?? []).map((c) => ({ ...c, kind: "creator" })),
  ]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <AppShell active="/log" subtitle="Log a new creator or brand">
      <LogForm recent={recent} />
    </AppShell>
  );
}
