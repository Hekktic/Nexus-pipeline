"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BRAND_STATUS_VALUES,
  DEAL_STAGE_VALUES,
  ONBOARDING_STATUS_VALUES,
  VETTING_STATUS_VALUES,
  brandStatusMeta,
  dealStageMeta,
  onboardingStatusMeta,
  vettingStatusMeta,
} from "@/lib/constants";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session-cookie-name";
import { checkPassword, sessionToken } from "@/lib/session";
import { computeAdvanced } from "@/lib/calculators/advanced";
import { computeQuick } from "@/lib/calculators/quick";
import { findMatchingRows } from "@/lib/duplicates";

const MAX_SHORT = 200;
const MAX_LONG = 2000;
const SUBJECT_TYPES = ["brand", "creator", "deal"];

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

function cleanProbability(value) {
  const n = cleanNumber(value);
  return n === null ? null : Math.min(100, Math.max(0, Math.round(n)));
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
 * Fetches id/name/contact for a table and hands them to the pure matcher
 * (lib/duplicates.js) rather than building a raw filter string — contact
 * info regularly contains commas and parentheses, which would otherwise
 * break Supabase's `.or()` filter syntax.
 */
async function findDuplicates(supabase, table, name, contact) {
  const { data, error } = await supabase.from(table).select("id, name, contact");
  if (error || !data) return [];
  return findMatchingRows(data, name, contact);
}

/**
 * Best-effort timeline entry — never blocks or fails the action it's called
 * from. A missed activity log is far less important than the actual save
 * succeeding.
 */
async function logActivity(supabase, subjectType, subjectId, type, description) {
  try {
    await supabase.from("activities").insert({
      subject_type: subjectType,
      subject_id: subjectId,
      type,
      description,
    });
  } catch {
    // Non-critical — swallow it.
  }
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

  if (!input?.confirmDuplicate) {
    const matches = await findDuplicates(ctx.supabase, "brands", name, contact);
    if (matches.length > 0) {
      return {
        ok: false,
        duplicate: true,
        matches: matches.map((m) => ({ id: m.id, name: m.name, contact: m.contact, kind: "brand" })),
        error: `A brand named "${matches[0].name}" already looks like a match.`,
      };
    }
  }

  const { data: created, error } = await ctx.supabase
    .from("brands")
    .insert({
      name,
      contact,
      website: clean(input?.website) || null,
      category: clean(input?.category) || null,
      margin_notes: clean(input?.marginNotes, MAX_LONG) || null,
      fulfillment_notes: clean(input?.fulfillmentNotes, MAX_LONG) || null,
      logged_by: loggedBy,
      status: "prospect",
    })
    .select("id")
    .single();

  if (error) return fail(error.message);

  await logActivity(ctx.supabase, "brand", created.id, "created", `Added by ${loggedBy}`);

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

  if (!input?.confirmDuplicate) {
    const matches = await findDuplicates(ctx.supabase, "creators", name, contact);
    if (matches.length > 0) {
      return {
        ok: false,
        duplicate: true,
        matches: matches.map((m) => ({ id: m.id, name: m.name, contact: m.contact, kind: "creator" })),
        error: `A creator named "${matches[0].name}" already looks like a match.`,
      };
    }
  }

  const platforms = {};
  for (const row of Array.isArray(input?.platforms) ? input.platforms : []) {
    const platform = clean(row?.platform, 50);
    const followers = clean(row?.followers, 50);
    if (platform) platforms[platform] = followers;
  }

  const { data: created, error } = await ctx.supabase
    .from("creators")
    .insert({
      name,
      contact,
      platforms,
      category: clean(input?.category) || null,
      audience_demographics: clean(input?.audienceDemographics, MAX_LONG) || null,
      pricing_expectations: clean(input?.pricingExpectations, MAX_LONG) || null,
      logged_by: loggedBy,
      vetting_status: "not_reviewed",
      onboarding_status: "applied",
    })
    .select("id")
    .single();

  if (error) return fail(error.message);

  await logActivity(ctx.supabase, "creator", created.id, "created", `Added by ${loggedBy}`);

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

  await logActivity(ctx.supabase, "brand", brandId, "profile_updated", "Profile updated");

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

  await logActivity(ctx.supabase, "creator", creatorId, "profile_updated", "Profile updated");

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

  await logActivity(
    ctx.supabase,
    "brand",
    brandId,
    isArchived ? "archived" : "restored",
    isArchived ? "Archived" : "Restored from archive"
  );

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

  await logActivity(
    ctx.supabase,
    "creator",
    creatorId,
    isArchived ? "archived" : "restored",
    isArchived ? "Archived" : "Restored from archive"
  );

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

  await logActivity(
    ctx.supabase,
    "brand",
    brandId,
    "status_changed",
    `Status changed to ${brandStatusMeta(status).label}`
  );

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

  await logActivity(
    ctx.supabase,
    "creator",
    creatorId,
    "vetting_status_changed",
    `Vetting status changed to ${vettingStatusMeta(status).label}`
  );

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

  await logActivity(
    ctx.supabase,
    "creator",
    creatorId,
    "onboarding_status_changed",
    `Onboarding status changed to ${onboardingStatusMeta(status).label}`
  );

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

  if (!SUBJECT_TYPES.includes(subjectType)) {
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

/** Attaches a tag to a brand or creator, creating the tag first if it doesn't exist yet (case-insensitive match). */
export async function addTag(subjectType, subjectId, tagName) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  if (!SUBJECT_TYPES.includes(subjectType)) return fail("Unknown subject.");

  const name = clean(tagName, 50);
  if (!name) return fail("Enter a tag name.");

  const { data: allTags, error: findError } = await ctx.supabase.from("tags").select("id, name");
  if (findError) return fail(findError.message);

  let tag = (allTags || []).find((t) => t.name.toLowerCase() === name.toLowerCase());

  if (!tag) {
    const { data: created, error: createError } = await ctx.supabase
      .from("tags")
      .insert({ name })
      .select("id, name")
      .single();
    if (createError) return fail(createError.message);
    tag = created;
  }

  const { error } = await ctx.supabase.from("contact_tags").insert({
    tag_id: tag.id,
    subject_type: subjectType,
    subject_id: subjectId,
  });

  // 23505 = unique_violation — this subject already has this tag, which is fine, not an error.
  if (error && error.code !== "23505") return fail(error.message);

  if (!error) {
    await logActivity(ctx.supabase, subjectType, subjectId, "tag_added", `Tagged "${tag.name}"`);
  }

  revalidatePath("/brands");
  revalidatePath("/creators");
  revalidatePath(`/${subjectType}s/${subjectId}`);
  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { ok: true, tag };
}

/** Removes one tag from one subject (by the contact_tags row id, not the tag id — a tag can stay attached to other records). */
export async function removeTag(contactTagId) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const { data: row, error: findError } = await ctx.supabase
    .from("contact_tags")
    .select("subject_type, subject_id, tag:tags ( name )")
    .eq("id", contactTagId)
    .maybeSingle();

  const { error } = await ctx.supabase.from("contact_tags").delete().eq("id", contactTagId);

  if (error) return fail(error.message);

  if (!findError && row) {
    await logActivity(
      ctx.supabase,
      row.subject_type,
      row.subject_id,
      "tag_removed",
      `Removed tag "${row.tag?.name ?? ""}"`
    );
  }

  revalidatePath("/brands");
  revalidatePath("/creators");
  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { ok: true };
}

/** Recomputes outputs from inputs server-side — never trusts client-sent numbers for what gets stored. */
function computeScenarioOutputs(mode, inputs) {
  if (mode === "quick") return computeQuick(inputs);
  if (mode === "advanced") return computeAdvanced(inputs);
  return { ok: false, errors: ["Unknown calculator mode."], outputs: null };
}

export async function createProfitScenario(input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const name = clean(input?.name, 120);
  if (!name) return fail("Give this scenario a name.");

  const mode = input?.mode === "advanced" ? "advanced" : "quick";
  const { ok, errors, outputs } = computeScenarioOutputs(mode, input?.inputs || {});
  if (!ok) return fail(errors[0] || "Couldn't calculate that scenario.");

  const { data: created, error } = await ctx.supabase
    .from("profit_scenarios")
    .insert({
      name,
      mode,
      brand_id: cleanOwnerId(input?.brandId),
      creator_id: cleanOwnerId(input?.creatorId),
      inputs: input?.inputs || {},
      outputs,
      created_by: clean(input?.createdBy) || null,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);

  revalidatePath("/calculator");
  return { ok: true, id: created.id, outputs };
}

export async function updateProfitScenario(scenarioId, input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const name = clean(input?.name, 120);
  if (!name) return fail("Give this scenario a name.");

  const mode = input?.mode === "advanced" ? "advanced" : "quick";
  const { ok, errors, outputs } = computeScenarioOutputs(mode, input?.inputs || {});
  if (!ok) return fail(errors[0] || "Couldn't calculate that scenario.");

  const { error } = await ctx.supabase
    .from("profit_scenarios")
    .update({
      name,
      mode,
      brand_id: cleanOwnerId(input?.brandId),
      creator_id: cleanOwnerId(input?.creatorId),
      inputs: input?.inputs || {},
      outputs,
    })
    .eq("id", scenarioId);

  if (error) return fail(error.message);

  revalidatePath("/calculator");
  return { ok: true, outputs };
}

export async function duplicateProfitScenario(scenarioId) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const { data: original, error: findError } = await ctx.supabase
    .from("profit_scenarios")
    .select("*")
    .eq("id", scenarioId)
    .maybeSingle();

  if (findError) return fail(findError.message);
  if (!original) return fail("That scenario no longer exists.");

  const { error } = await ctx.supabase.from("profit_scenarios").insert({
    name: `${original.name} (copy)`,
    mode: original.mode,
    brand_id: original.brand_id,
    creator_id: original.creator_id,
    inputs: original.inputs,
    outputs: original.outputs,
    created_by: original.created_by,
  });

  if (error) return fail(error.message);

  revalidatePath("/calculator");
  return { ok: true };
}

export async function setProfitScenarioArchived(scenarioId, isArchived) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const { error } = await ctx.supabase
    .from("profit_scenarios")
    .update({ status: isArchived ? "archived" : "draft" })
    .eq("id", scenarioId);

  if (error) return fail(error.message);

  revalidatePath("/calculator");
  return { ok: true };
}

/** A new sales opportunity for a brand or creator. A relationship can have more than one deal over time. */
export async function createDeal(input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const subjectType = input?.subjectType;
  const subjectId = input?.subjectId;
  if (subjectType !== "brand" && subjectType !== "creator") return fail("Choose a brand or creator.");
  if (!subjectId) return fail("Choose a brand or creator.");

  const { data: created, error } = await ctx.supabase
    .from("deals")
    .insert({
      subject_type: subjectType,
      subject_id: subjectId,
      deal_value: cleanNumber(input?.dealValue),
      probability: cleanProbability(input?.probability),
      expected_close_date: cleanDate(input?.expectedCloseDate),
      owner_id: cleanOwnerId(input?.ownerId),
      next_action: clean(input?.nextAction, MAX_LONG) || null,
      next_follow_up_date: cleanDate(input?.nextFollowUpDate),
    })
    .select("id")
    .single();

  if (error) return fail(error.message);

  await logActivity(ctx.supabase, "deal", created.id, "created", "Deal created");

  revalidatePath("/pipeline");
  revalidatePath(`/${subjectType}s/${subjectId}`);
  return { ok: true, id: created.id };
}

/** Full edit from the deal detail page — everything except stage, which goes through updateDealStage so stage changes always get logged. */
export async function updateDeal(dealId, input) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  const { error } = await ctx.supabase
    .from("deals")
    .update({
      deal_value: cleanNumber(input?.dealValue),
      probability: cleanProbability(input?.probability),
      expected_close_date: cleanDate(input?.expectedCloseDate),
      owner_id: cleanOwnerId(input?.ownerId),
      next_action: clean(input?.nextAction, MAX_LONG) || null,
      next_follow_up_date: cleanDate(input?.nextFollowUpDate),
    })
    .eq("id", dealId);

  if (error) return fail(error.message);

  await logActivity(ctx.supabase, "deal", dealId, "profile_updated", "Deal details updated");

  revalidatePath("/pipeline");
  revalidatePath(`/deals/${dealId}`);
  return { ok: true };
}

/** Stage changes are their own action so every one gets logged, and a "lost" reason is captured (and cleared going forward) consistently. */
export async function updateDealStage(dealId, stage, lostReason) {
  const ctx = await requireSession();
  if (ctx.error) return fail(ctx.error);

  if (!DEAL_STAGE_VALUES.includes(stage)) return fail("Unknown stage.");

  const { data: current, error: findError } = await ctx.supabase
    .from("deals")
    .select("stage")
    .eq("id", dealId)
    .maybeSingle();
  if (findError) return fail(findError.message);

  const { error } = await ctx.supabase
    .from("deals")
    .update({
      stage,
      lost_reason: stage === "lost" ? clean(lostReason, MAX_LONG) || null : null,
    })
    .eq("id", dealId);

  if (error) return fail(error.message);

  if (current && current.stage !== stage) {
    await logActivity(
      ctx.supabase,
      "deal",
      dealId,
      "stage_changed",
      `Stage changed from ${dealStageMeta(current.stage).label} to ${dealStageMeta(stage).label}`
    );
  }

  revalidatePath("/pipeline");
  revalidatePath(`/deals/${dealId}`);
  return { ok: true };
}
