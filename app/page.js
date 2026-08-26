import { redirect } from "next/navigation";
import SetupNotice from "@/components/SetupNotice";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/** Front door: middleware already confirmed the shared password, so just pick a landing screen. */
export default async function Home() {
  if (!hasSupabaseEnv) return <SetupNotice />;

  redirect("/log");
}
