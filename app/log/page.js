import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import LogForm from "@/components/LogForm";
import NoRoleNotice from "@/components/NoRoleNotice";
import { getSessionProfile, homeFor, isLogger } from "@/lib/auth";
import { displayName } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const { user, profile, supabase } = await getSessionProfile();
  if (!user) redirect("/login");
  if (!profile) return <NoRoleNotice email={user.email} />;

  // Closers get the pipeline instead; admins may use either screen.
  if (!isLogger(profile)) redirect(homeFor(profile));

  const { data: recent } = await supabase
    .from("entries")
    .select("id, name, type, status, created_at")
    .eq("logged_by", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <AppShell profile={profile} subtitle="Log a new creator or brand">
      <LogForm
        recent={recent ?? []}
        loggerName={displayName(profile) || user.email}
      />
    </AppShell>
  );
}
