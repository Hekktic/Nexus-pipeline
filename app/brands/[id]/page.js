import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import BrandProfile from "@/components/BrandProfile";
import CenteredScreen from "@/components/CenteredScreen";
import SetupNotice from "@/components/SetupNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { fetchTagsFor } from "@/lib/tags";
import { fetchTimelineFor } from "@/lib/timeline";

export const dynamic = "force-dynamic";

export default async function BrandDetailPage({ params }) {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const { id } = await params;
  const supabase = createClient();

  const [{ data: brand, error: brandError }, { data: teamMembers }, { data: allTags }, { tags }, { timeline }, { data: deals }] =
    await Promise.all([
      supabase.from("brands").select("*").eq("id", id).maybeSingle(),
      supabase.from("team_members").select("id, display_name").eq("is_active", true).order("display_name"),
      supabase.from("tags").select("name").order("name"),
      fetchTagsFor(supabase, "brand", id),
      fetchTimelineFor(supabase, "brand", id),
      supabase
        .from("deals")
        .select("id, stage, deal_value")
        .eq("subject_type", "brand")
        .eq("subject_id", id)
        .order("updated_at", { ascending: false }),
    ]);

  if (brandError) {
    return (
      <AppShell subtitle="Brand profile">
        <p className="text-sm text-red-400">Couldn&apos;t load this brand: {brandError.message}</p>
      </AppShell>
    );
  }

  if (!brand) notFound();

  return (
    <AppShell subtitle="Brand profile">
      <BrandProfile
        brand={brand}
        teamMembers={teamMembers ?? []}
        timeline={timeline}
        tags={tags}
        allTagNames={(allTags ?? []).map((t) => t.name)}
        deals={deals ?? []}
      />
    </AppShell>
  );
}
