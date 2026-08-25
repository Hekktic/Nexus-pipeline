import { redirect } from "next/navigation";
import NoRoleNotice from "@/components/NoRoleNotice";
import SetupNotice from "@/components/SetupNotice";
import { getSessionProfile, homeFor } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/** Front door: send each role to the screen it actually uses. */
export default async function Home() {
  if (!hasSupabaseEnv) return <SetupNotice />;

  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (!profile) return <NoRoleNotice email={user.email} />;

  redirect(homeFor(profile));
}
