import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import NoRoleNotice from "@/components/NoRoleNotice";
import PipelineView from "@/components/PipelineView";
import { getSessionProfile, homeFor, isCloser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SELECT = `
  id, type, name, contact, category, detail, notes, status,
  logged_by, assigned_to, created_at, updated_at,
  logger:profiles!entries_logged_by_fkey ( full_name, email ),
  assignee:profiles!entries_assigned_to_fkey ( full_name, email ),
  call_logs (
    id, note, created_at,
    author:profiles!call_logs_author_id_fkey ( full_name, email )
  )
`;

export default async function PipelinePage() {
  const { user, profile, supabase } = await getSessionProfile();
  if (!user) redirect("/login");
  if (!profile) return <NoRoleNotice email={user.email} />;

  // Loggers only ever see their own capture form.
  if (!isCloser(profile)) redirect(homeFor(profile));

  const { data: entries, error } = await supabase
    .from("entries")
    .select(SELECT)
    .order("updated_at", { ascending: false })
    .order("created_at", { referencedTable: "call_logs", ascending: false });

  return (
    <AppShell profile={profile} subtitle="Every logged contact">
      {error ? (
        <p className="text-sm text-red-400">
          Couldn&apos;t load the pipeline: {error.message}
        </p>
      ) : (
        <PipelineView entries={entries ?? []} currentUserId={user.id} />
      )}
    </AppShell>
  );
}
