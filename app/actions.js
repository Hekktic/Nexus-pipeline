"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BRAND_STATUS_VALUES,
  ONBOARDING_STATUS_VALUES,
  VETTING_STATUS_VALUES,
} from "@/lib/constants";
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

export async function createBrand(input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const name = clean(input?.name);
  const contact = clean(input?.contact);
  const loggedBy = clean(input?.loggedBy);

  if (!name) return fail("Enter a name.");
  if (!contact) return fail("Enter contact info.");
  if (!loggedBy) return fail("Enter your name.");

  const { error } = await ctx.supabase.from("brands").insert({
    name,
    contact,
    website: clean(input?.website) || null,
    category: clean(input?.category) || null,
    margin_notes: clean(input?.marginNotes, MAX_LONG) || null,
    fulfillment_notes: clean(input?.fulfillmentNotes, MAX_LONG) || null,
    logged_by: loggedBy,
    status: "prospect",
  });

  if (error) return fail(error.message);

  revalidatePath("/log");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function createCreator(input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const name = clean(input?.name);
  const contact = clean(input?.contact);
  const loggedBy = clean(input?.loggedBy);

  if (!name) return fail("Enter a name.");
  if (!contact) return fail("Enter contact info.");
  if (!loggedBy) return fail("Enter your name.");

  const platforms = {};
  for (const row of Array.isArray(input?.platforms) ? input.platforms : []) {
    const platform = clean(row?.platform, 50);
    const followers = clean(row?.followers, 50);
    if (platform) platforms[platform] = followers;
  }

  const { error } = await ctx.supabase.from("creators").insert({
    name,
    contact,
    platforms,
    category: clean(input?.category) || null,
    audience_demographics: clean(input?.audienceDemographics, MAX_LONG) || null,
    pricing_expectations: clean(input?.pricingExpectations, MAX_LONG) || null,
    logged_by: loggedBy,
    vetting_status: "not_reviewed",
    onboarding_status: "applied",
  });

  if (error) return fail(error.message);

  revalidatePath("/log");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function updateBrandStatus(brandId, status) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  if (!BRAND_STATUS_VALUES.includes(status)) return fail("Unknown status.");

  const { error } = await ctx.supabase
    .from("brands")
    .update({ status })
    .eq("id", brandId);

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function updateCreatorVettingStatus(creatorId, status) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  if (!VETTING_STATUS_VALUES.includes(status)) return fail("Unknown status.");

  const { error } = await ctx.supabase
    .from("creators")
    .update({ vetting_status: status })
    .eq("id", creatorId);

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function updateCreatorOnboardingStatus(creatorId, status) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  if (!ONBOARDING_STATUS_VALUES.includes(status)) return fail("Unknown status.");

  const { error } = await ctx.supabase
    .from("creators")
    .update({ onboarding_status: status })
    .eq("id", creatorId);

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function addCallLog(subjectType, subjectId, text) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  if (subjectType !== "brand" && subjectType !== "creator") {
    return fail("Unknown subject.");
  }

  const cleanText = clean(text, MAX_LONG);
  if (!cleanText) return fail("Write something first.");

  const { error } = await ctx.supabase.from("call_logs").insert({
    subject_type: subjectType,
    subject_id: subjectId,
    text: cleanText,
  });

  if (error) return fail(error.message);

  revalidatePath("/pipeline");
  return { ok: true };
}
