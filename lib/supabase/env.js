export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * The app renders a setup screen instead of crashing when these are missing,
 * so a fresh clone with no .env.local still boots.
 */
export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
