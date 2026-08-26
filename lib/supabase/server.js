import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Server-only client using the anon/publishable key. There's no Supabase
 * Auth session — the app itself is gated by the shared password in
 * middleware.js. This key only works because the RLS policies in
 * supabase/schema.sql grant the "anon" role full read/write; nothing about
 * the key itself is a secret. Still only ever call this from server code
 * (Server Components / Server Actions), never from a Client Component, so
 * database access always goes through the password gate first.
 */
export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}
