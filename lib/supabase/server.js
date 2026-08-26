import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";

/**
 * Server-only client using the service role key. There is no per-user
 * session anymore — the app itself is gated by the shared password in
 * middleware.js, so the database has one trusted caller: this server.
 * Never import this from a Client Component or expose the service key
 * to the browser.
 */
export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
