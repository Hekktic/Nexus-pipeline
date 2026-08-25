import "server-only";
import { createClient } from "@/lib/supabase/server";

export const CLOSER_ROLES = ["closer", "admin"];
export const LOGGER_ROLES = ["logger", "admin"];

export function isCloser(profile) {
  return CLOSER_ROLES.includes(profile?.role);
}

export function isLogger(profile) {
  return LOGGER_ROLES.includes(profile?.role);
}

/** Where a given role belongs after login. */
export function homeFor(profile) {
  return isCloser(profile) ? "/pipeline" : "/log";
}

/**
 * The signed-in user plus their profile row. If the profile is missing — a user
 * created before the schema trigger existed — one is created as 'logger', which
 * is all the RLS insert policy permits.
 */
export async function getSessionProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) return { supabase, user, profile };

  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
      role: "logger",
    })
    .select("id, email, full_name, role")
    .maybeSingle();

  return { supabase, user, profile: created ?? null };
}
