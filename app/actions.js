"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ENTRY_TYPES, STATUS_VALUES } from "@/lib/constants";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session-cookie-name";
import { checkPassword, sessionToken } from "@/lib/session";

const MAX_SHORT = 200;
const MAX_LONG = 2000;

function fail(error) {
  return { ok: false, error };
}

function clean(value, max = MAX_SHORT) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Every action re-checks the session cookie server-side. Middleware already
 * keeps signed-out visitors off these routes; this is just cheap insurance.
 */
async function requireSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookie || cookie !== sessionToken()) {
    return { error: "Your session expired. Sign in again." };
  }
  return { supabase: createClient() };
}

export async function login(password) {
  if (!checkPassword(password)) return fail("Incorrect password.");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function createEntry(input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const type = ENTRY_TYPES.includes(input?.type) ? input.type : "creator";
  const name = clean(input?.name);
  const contact = clean(input?.contact);

  if (!name) return fail("Enter a name.");
  if (!contact) return fail("Enter contact info.");

  const { error } = await ctx.supabase.from("entries").insert({
    type,
    name,
    contact,
    category: clean(input?.category) || null,
    detail: clean(input?.detail) || null,
    notes: clean(input?.notes, MAX_LONG) || null,
    logged_by: clean(input?.loggerName) || null,
    status: "new",
  });

  if (error) return fail(error.message);

  revalidatePath("/log");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function updateEntryStatus(entryId, status) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  if (!STATUS_VALUES.includes(status)) return fail("Unknown status.");

  const { error } = await ctx.supabase
    .from("entries")
    .update({ status })
    .eq("id", entryId);

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}

/** Claim work for yourself — or drop it again. `name` is the free-text "Your name" field. */
export async function setSelfAssignment(entryId, name, assign) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const cleanName = clean(name);
  if (assign && !cleanName) return fail("Enter your name first.");

  const { error } = await ctx.supabase
    .from("entries")
    .update({ assigned_to: assign ? cleanName : null })
    .eq("id", entryId);

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function addCallLog(entryId, note, authorName) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const text = clean(note, MAX_LONG);
  if (!text) return fail("Write something first.");

  const { error } = await ctx.supabase.from("call_logs").insert({
    entry_id: entryId,
    author_name: clean(authorName) || null,
    note: text,
  });

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}
