/**
 * Edge-safe (no Node APIs) version of the session token check, for use in
 * middleware.js — the Edge Runtime doesn't support the "node:crypto" module,
 * only the standard Web Crypto API. Must produce the same digest as
 * lib/session.js's sessionToken(), since both hash the same env var.
 */
export async function expectedSessionToken() {
  const data = new TextEncoder().encode(process.env.APP_PASSWORD || "");
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
