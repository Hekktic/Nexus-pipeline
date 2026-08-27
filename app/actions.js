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

function cleanNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanDate(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanRating(value) {
  const n = cleanNumber(value);
  return n === null ? null : Math.min(5, Math.max(1, Math.round(n)));
}

function cleanBoolean(value) {
  return value === null || value === undefined ? null : Boolean(value);
}

function cleanOwnerId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanPriority(value) {
  return ["low", "medium", "high"].includes(value) ? value : null;
}

function cleanLinkMap(rows) {
  const map = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = clean(row?.platform, 50);
    const url = clean(row?.url, 300);
    if (key) map[key] = url;
  }
  return map;
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

/** Full profile edit from the brand detail page — separate from the quick status dropdown used elsewhere. */
export async function updateBrand(brandId, input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const name = clean(input?.name);
  const contact = clean(input?.contact);
  if (!name) return fail("Enter a name.");
  if (!contact) return fail("Enter contact info.");

  const { error } = await ctx.supabase
    .from("brands")
    .update({
      name,
      contact,
      website: clean(input?.website) || null,
      category: clean(input?.category) || null,
      primary_contact_name: clean(input?.primaryContactName) || null,
      contact_title: clean(input?.contactTitle) || null,
      email: clean(input?.email) || null,
      phone: clean(input?.phone) || null,
      products: clean(input?.products, MAX_LONG) || null,
      avg_product_price: cleanNumber(input?.avgProductPrice),
      target_customer: clean(input?.targetCustomer, MAX_LONG) || null,
      preferred_niches: clean(input?.preferredNiches, MAX_LONG) || null,
      preferred_platforms: clean(input?.preferredPlatforms, MAX_LONG) || null,
      campaign_objectives: clean(input?.campaignObjectives, MAX_LONG) || null,
      budget: clean(input?.budget) || null,
      commission_range: clean(input?.commissionRange) || null,
      sample_availability: clean(input?.sampleAvailability) || null,
      margin_notes: clean(input?.marginNotes, MAX_LONG) || null,
      fulfillment_notes: clean(input?.fulfillmentNotes, MAX_LONG) || null,
      notes: clean(input?.notes, MAX_LONG) || null,
      owner_id: cleanOwnerId(input?.ownerId),
      last_contact_date: cleanDate(input?.lastContactDate),
      next_follow_up_date: cleanDate(input?.nextFollowUpDate),
      estimated_deal_value: cleanNumber(input?.estimatedDealValue),
      preferred_contact_method: clean(input?.preferredContactMethod) || null,
      follow_up_priority: cleanPriority(input?.followUpPriority),
      social_links: cleanLinkMap(input?.socialLinks),
    })
    .eq("id", brandId);

  if (error) return fail(error.message);

  revalidatePath("/brands");
  revalidatePath(`/brands/${brandId}`);
  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { ok: true };
}

/** Full profile edit from the creator detail page — separate from the quick status dropdowns used elsewhere. */
export async function updateCreator(creatorId, input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const name = clean(input?.name);
  const contact = clean(input?.contact);
  if (!name) return fail("Enter a name.");
  if (!contact) return fail("Enter contact info.");

  const { error } = await ctx.supabase
    .from("creators")
    .update({
      name,
      contact,
      category: clean(input?.category) || null,
      audience_demographics: clean(input?.audienceDemographics, MAX_LONG) || null,
      pricing_expectations: clean(input?.pricingExpectations, MAX_LONG) || null,
      location: clean(input?.location) || null,
      age_confirmed: cleanBoolean(input?.ageConfirmed),
      primary_platform: clean(input?.primaryPlatform) || null,
      platform_links: cleanLinkMap(input?.platformLinks),
      secondary_niches: clean(input?.secondaryNiches, MAX_LONG) || null,
      avg_views: clean(input?.avgViews) || null,
      engagement_rate: clean(input?.engagementRate) || null,
      content_style: clean(input?.contentStyle, MAX_LONG) || null,
      previous_brand_partnerships: clean(input?.previousBrandPartnerships, MAX_LONG) || null,
      preferred_compensation: clean(input?.preferredCompensation) || null,
      minimum_rate: clean(input?.minimumRate) || null,
      affiliate_interest: cleanBoolean(input?.affiliateInterest),
      sample_interest: cleanBoolean(input?.sampleInterest),
      availability: clean(input?.availability) || null,
      reliability_rating: cleanRating(input?.reliabilityRating),
      brand_safety_notes: clean(input?.brandSafetyNotes, MAX_LONG) || null,
      portfolio_url: clean(input?.portfolioUrl, 300) || null,
      owner_id: cleanOwnerId(input?.ownerId),
      last_contact_date: cleanDate(input?.lastContactDate),
      next_follow_up_date: cleanDate(input?.nextFollowUpDate),
      total_earnings: cleanNumber(input?.totalEarnings),
      preferred_contact_method: clean(input?.preferredContactMethod) || null,
      follow_up_priority: cleanPriority(input?.followUpPriority),
      notes: clean(input?.notes, MAX_LONG) || null,
    })
    .eq("id", creatorId);

  if (error) return fail(error.message);

  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { ok: true };
}

/** Archiving hides a brand from active views (Pipeline, Contacts) without deleting it. */
export async function setBrandArchived(brandId, isArchived) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const { error } = await ctx.supabase
    .from("brands")
    .update({ is_archived: Boolean(isArchived) })
    .eq("id", brandId);

  if (error) return fail(error.message);

  revalidatePath("/brands");
  revalidatePath(`/brands/${brandId}`);
  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { ok: true };
}

/** Archiving hides a creator from active views (Pipeline, Contacts) without deleting it. */
export async function setCreatorArchived(creatorId, isArchived) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const { error } = await ctx.supabase
    .from("creators")
    .update({ is_archived: Boolean(isArchived) })
    .eq("id", creatorId);

  if (error) return fail(error.message);

  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/pipeline");
  revalidatePath("/contacts");
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

export async function createTeamMember(input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const displayName = clean(input?.displayName);
  if (!displayName) return fail("Enter a name.");

  const { error } = await ctx.supabase.from("team_members").insert({
    display_name: displayName,
    role: clean(input?.role) || null,
  });

  if (error) return fail(error.message);

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateTeamMember(memberId, input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const displayName = clean(input?.displayName);
  if (!displayName) return fail("Enter a name.");

  const { error } = await ctx.supabase
    .from("team_members")
    .update({ display_name: displayName, role: clean(input?.role) || null })
    .eq("id", memberId);

  if (error) return fail(error.message);

  revalidatePath("/settings");
  return { ok: true };
}

export async function setTeamMemberActive(memberId, isActive) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const { error } = await ctx.supabase
    .from("team_members")
    .update({ is_active: Boolean(isActive) })
    .eq("id", memberId);

  if (error) return fail(error.message);

  revalidatePath("/settings");
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
