import AppShell from "@/components/AppShell";
import LogForm from "@/components/LogForm";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  if (!hasSupabaseEnv) return <SetupNotice />;

  const supabase = createClient();
  const { data: recent } = await supabase
    .from("entries")
    .select("id, name, type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <AppShell active="/log" subtitle="Log a new creator or brand">
      <LogForm recent={recent ?? []} />
    </AppShell>
  );
}
