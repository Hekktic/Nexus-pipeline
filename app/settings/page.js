import AppShell from "@/components/AppShell";
import CenteredScreen from "@/components/CenteredScreen";
import ComingSoonPage from "@/components/ComingSoonPage";
import SetupNotice from "@/components/SetupNotice";
import TeamMembersSection from "@/components/TeamMembersSection";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!hasSupabaseEnv) return <CenteredScreen><SetupNotice /></CenteredScreen>;

  const supabase = createClient();
  const { data: members, error } = await supabase
    .from("team_members")
    .select("*")
    .order("display_name", { ascending: true });

  return (
    <AppShell subtitle="Team, pipeline stages, tags, and business info">
      <div className="space-y-8">
        <section>
          <h2 className="mb-1 text-sm font-semibold text-white">Appearance</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Only changes how the site looks on this device — everyone else keeps their own choice.
          </p>
          <ThemeToggle />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Team members</h2>
          {error ? (
            <p className="text-sm text-red-400">
              Couldn&apos;t load team members: {error.message}
            </p>
          ) : (
            <TeamMembersSection members={members ?? []} />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Everything else</h2>
          <ComingSoonPage title="Pipeline stages, campaign stages, tags, document categories, and business info" />
        </section>
      </div>
    </AppShell>
  );
}
