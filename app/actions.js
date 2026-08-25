"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile, isCloser, isLogger } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ENTRY_TYPES, STATUS_VALUES } from "@/lib/constants";

const MAX_SHORT = 200;
const MAX_LONG = 2000;

function fail(error) {
  return { ok: false, error };
}

function clean(value, max = MAX_SHORT) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Every action re-checks the role server-side. RLS would reject a forged
 * request anyway; this just turns it into a readable message.
 */
async function requireRole(check, message) {
  const { user, profile, supabase } = await getSessionProfile();
  if (!user) return { error: "Your session expired. Sign in again." };
  if (!check(profile)) return { error: message };
  return { user, profile, supabase };
}

export async function createEntry(input) {
  const ctx = await requireRole(
    isLogger,
    "Your account isn't set up to log contacts."
  );
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
    logged_by: ctx.user.id,
    status: "new",
  });

  if (error) return fail(error.message);

  revalidatePath("/log");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function updateEntryStatus(entryId, status) {
  const ctx = await requireRole(isCloser, "Only closers can change status.");
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

/** Closers claim work for themselves — or drop it again. */
export async function setSelfAssignment(entryId, assign) {
  const ctx = await requireRole(isCloser, "Only closers can assign entries.");
  if (ctx.error) return fail(ctx.error);

  const { error } = await ctx.supabase
    .from("entries")
    .update({ assigned_to: assign ? ctx.user.id : null })
    .eq("id", entryId);

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function addCallLog(entryId, note) {
  const ctx = await requireRole(isCloser, "Only closers can add call notes.");
  if (ctx.error) return fail(ctx.error);

  const text = clean(note, MAX_LONG);
  if (!text) return fail("Write something first.");

  const { error } = await ctx.supabase.from("call_logs").insert({
    entry_id: entryId,
    author_id: ctx.user.id,
    note: text,
  });

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
