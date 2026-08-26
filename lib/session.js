import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export const APP_PASSWORD = process.env.APP_PASSWORD;
export const hasAppPassword = Boolean(APP_PASSWORD);

/** Constant-time compare against APP_PASSWORD, so login isn't timeable. */
export function checkPassword(password) {
  if (!APP_PASSWORD) return false;
  const a = Buffer.from(String(password ?? ""));
  const b = Buffer.from(APP_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The value stored in the session cookie once the password checks out. */
export function sessionToken() {
  return createHash("sha256").update(APP_PASSWORD || "").digest("hex");
}
