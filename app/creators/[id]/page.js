import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import CreatorProfile from "@/components/CreatorProfile";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { fetchTagsFor } from "@/lib/tags";
import { fetchTimelineFor } from "@/lib/timeline";

export const dynamic = "force-dynamic";

export default async function CreatorDetailPage({ params }) {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const { id } = await params;
  const supabase = createClient();

  const [{ data: creator, error: creatorError }, { data: teamMembers }, { data: allTags }, { tags }, { timeline }] =
    await Promise.all([
      supabase.from("creators").select("*").eq("id", id).maybeSingle(),
      supabase.from("team_members").select("id, display_name").eq("is_active", true).order("display_name"),
      supabase.from("tags").select("name").order("name"),
      fetchTagsFor(supabase, "creator", id),
      fetchTimelineFor(supabase, "creator", id),
    ]);

  if (creatorError) {
    return (
      <AppShell subtitle="Creator profile">
        <p className="text-sm text-red-400">Couldn&apos;t load this creator: {creatorError.message}</p>
      </AppShell>
    );
  }

  if (!creator) notFound();

  return (
    <AppShell subtitle="Creator profile">
      <CreatorProfile
        creator={creator}
        teamMembers={teamMembers ?? []}
        timeline={timeline}
        tags={tags}
        allTagNames={(allTags ?? []).map((t) => t.name)}
      />
    </AppShell>
  );
}
