import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import DealProfile from "@/components/DealProfile";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { fetchTagsFor } from "@/lib/tags";
import { fetchTimelineFor } from "@/lib/timeline";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }) {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const { id } = await params;
  const supabase = createClient();

  const [{ data: deal, error: dealError }, { data: teamMembers }, { data: allTags }, { tags }, { timeline }] =
    await Promise.all([
      supabase
        .from("deals")
        .select("*, owner:team_members!deals_owner_id_fkey ( id, display_name )")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("team_members").select("id, display_name").eq("is_active", true).order("display_name"),
      supabase.from("tags").select("name").order("name"),
      fetchTagsFor(supabase, "deal", id),
      fetchTimelineFor(supabase, "deal", id),
    ]);

  if (dealError) {
    return (
      <AppShell subtitle="Deal">
        <p className="text-sm text-red-400">Couldn&apos;t load this deal: {dealError.message}</p>
      </AppShell>
    );
  }

  if (!deal) notFound();

  const { data: subject } = await supabase
    .from(deal.subject_type === "brand" ? "brands" : "creators")
    .select("id, name")
    .eq("id", deal.subject_id)
    .maybeSingle();

  return (
    <AppShell subtitle="Deal">
      <DealProfile
        deal={deal}
        subject={subject}
        teamMembers={teamMembers ?? []}
        timeline={timeline}
        tags={tags}
        allTagNames={(allTags ?? []).map((t) => t.name)}
      />
    </AppShell>
  );
}
