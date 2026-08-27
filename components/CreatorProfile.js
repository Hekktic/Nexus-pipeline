"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, ArchiveRestore, Clock, Plus, X } from "lucide-react";
import {
  addCallLog,
  setCreatorArchived,
  updateCreator,
  updateCreatorOnboardingStatus,
  updateCreatorVettingStatus,
} from "@/app/actions";
import Field from "@/components/Field";
import TimeAgo from "@/components/TimeAgo";
import { ONBOARDING_STATUS_OPTIONS, VETTING_STATUS_OPTIONS } from "@/lib/constants";

function toFormState(creator) {
  const platformLinks = Object.entries(creator.platform_links || {});
  return {
    name: creator.name || "",
    contact: creator.contact || "",
    category: creator.category || "",
    audienceDemographics: creator.audience_demographics || "",
    pricingExpectations: creator.pricing_expectations || "",
    location: creator.location || "",
    ageConfirmed: Boolean(creator.age_confirmed),
    primaryPlatform: creator.primary_platform || "",
    platformLinks: platformLinks.length
      ? platformLinks.map(([platform, url]) => ({ platform, url }))
      : [{ platform: "", url: "" }],
    secondaryNiches: creator.secondary_niches || "",
    avgViews: creator.avg_views || "",
    engagementRate: creator.engagement_rate || "",
    contentStyle: creator.content_style || "",
    previousBrandPartnerships: creator.previous_brand_partnerships || "",
    preferredCompensation: creator.preferred_compensation || "",
    minimumRate: creator.minimum_rate || "",
    affiliateInterest: Boolean(creator.affiliate_interest),
    sampleInterest: Boolean(creator.sample_interest),
    availability: creator.availability || "",
    reliabilityRating: creator.reliability_rating ?? "",
    brandSafetyNotes: creator.brand_safety_notes || "",
    portfolioUrl: creator.portfolio_url || "",
    ownerId: creator.owner_id || "",
    lastContactDate: creator.last_contact_date || "",
    nextFollowUpDate: creator.next_follow_up_date || "",
    totalEarnings: creator.total_earnings ?? "",
    preferredContactMethod: creator.preferred_contact_method || "",
    followUpPriority: creator.follow_up_priority || "",
    notes: creator.notes || "",
  };
}

export default function CreatorProfile({ creator, teamMembers = [], callLogs = [] }) {
  const [form, setForm] = useState(() => toFormState(creator));
  const [noteDraft, setNoteDraft] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setChecked = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  const setPlatformRow = (i, key) => (e) =>
    setForm((f) => ({
      ...f,
      platformLinks: f.platformLinks.map((row, idx) =>
        idx === i ? { ...row, [key]: e.target.value } : row
      ),
    }));

  const addPlatformRow = () =>
    setForm((f) => ({ ...f, platformLinks: [...f.platformLinks, { platform: "", url: "" }] }));

  const removePlatformRow = (i) =>
    setForm((f) => ({ ...f, platformLinks: f.platformLinks.filter((_, idx) => idx !== i) }));

  const toggleArchived = () => {
    startTransition(async () => {
      const result = await setCreatorArchived(creator.id, !creator.is_archived);
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  const save = () => {
    setError("");
    startTransition(async () => {
      const result = await updateCreator(creator.id, form);
      if (!result?.ok) {
        setError(result?.error || "Couldn't save that. Try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const changeVetting = (status) => {
    startTransition(async () => {
      const result = await updateCreatorVettingStatus(creator.id, status);
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  const changeOnboarding = (status) => {
    startTransition(async () => {
      const result = await updateCreatorOnboardingStatus(creator.id, status);
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    startTransition(async () => {
      const result = await addCallLog("creator", creator.id, text);
      if (result?.ok) setNoteDraft("");
      else setError(result?.error || "That didn't save. Try again.");
    });
  };

  return (
    <div className="space-y-6">
      <Link href="/creators" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={14} /> Back to creators
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white">
            {creator.name}
            {creator.is_archived && (
              <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                Archived
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            Logged by {creator.logged_by || "—"} · Updated <TimeAgo ts={creator.updated_at} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input-sm"
            value={creator.vetting_status}
            disabled={pending}
            onChange={(e) => changeVetting(e.target.value)}
          >
            {VETTING_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            className="input-sm"
            value={creator.onboarding_status}
            disabled={pending}
            onChange={(e) => changeOnboarding(e.target.value)}
          >
            {ONBOARDING_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={toggleArchived}
            disabled={pending}
            title={creator.is_archived ? "Restore to active views" : "Hide from active views"}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200 disabled:opacity-50"
          >
            {creator.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {creator.is_archived ? "Restore" : "Archive"}
          </button>
        </div>
      </div>

      <Section title="Contact">
        <Grid>
          <Field label="Name" required><input className="input" value={form.name} onChange={set("name")} /></Field>
          <Field label="Contact info" required><input className="input" value={form.contact} onChange={set("contact")} placeholder="email or phone" /></Field>
          <Field label="Location"><input className="input" value={form.location} onChange={set("location")} /></Field>
          <Field label="Portfolio / media kit link"><input className="input" value={form.portfolioUrl} onChange={set("portfolioUrl")} /></Field>
          <Field label="Preferred contact method"><input className="input" value={form.preferredContactMethod} onChange={set("preferredContactMethod")} placeholder="e.g. email, DM, phone" /></Field>
        </Grid>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={form.ageConfirmed} onChange={setChecked("ageConfirmed")} />
          18+ eligibility confirmed
        </label>
      </Section>

      <Section title="Platforms">
        <Grid>
          <Field label="Primary platform"><input className="input" value={form.primaryPlatform} onChange={set("primaryPlatform")} /></Field>
          <Field label="Primary niche"><input className="input" value={form.category} onChange={set("category")} /></Field>
          <Field label="Secondary niches"><input className="input" value={form.secondaryNiches} onChange={set("secondaryNiches")} /></Field>
          <Field label="Average views"><input className="input" value={form.avgViews} onChange={set("avgViews")} /></Field>
          <Field label="Engagement rate"><input className="input" value={form.engagementRate} onChange={set("engagementRate")} /></Field>
          <Field label="Content style"><input className="input" value={form.contentStyle} onChange={set("contentStyle")} /></Field>
        </Grid>

        <Field label="Profile links">
          <div className="space-y-2">
            {form.platformLinks.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input"
                  value={row.platform}
                  onChange={setPlatformRow(i, "platform")}
                  placeholder="e.g. TikTok"
                />
                <input
                  className="input"
                  value={row.url}
                  onChange={setPlatformRow(i, "url")}
                  placeholder="Profile URL"
                />
                <button
                  type="button"
                  onClick={() => removePlatformRow(i)}
                  disabled={form.platformLinks.length === 1}
                  className="shrink-0 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPlatformRow}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            >
              <Plus size={12} /> Add platform link
            </button>
          </div>
        </Field>

        <div className="mt-3">
          <Field label="Audience demographics">
            <textarea className="input min-h-[60px]" value={form.audienceDemographics} onChange={set("audienceDemographics")} />
          </Field>
        </div>
      </Section>

      <Section title="Partnerships">
        <Grid>
          <Field label="Previous brand partnerships"><input className="input" value={form.previousBrandPartnerships} onChange={set("previousBrandPartnerships")} /></Field>
          <Field label="Preferred compensation structure"><input className="input" value={form.preferredCompensation} onChange={set("preferredCompensation")} /></Field>
          <Field label="Minimum rate"><input className="input" value={form.minimumRate} onChange={set("minimumRate")} /></Field>
          <Field label="Pricing expectations"><input className="input" value={form.pricingExpectations} onChange={set("pricingExpectations")} /></Field>
          <Field label="Availability"><input className="input" value={form.availability} onChange={set("availability")} /></Field>
          <Field label="Reliability rating (1-5)">
            <input className="input" type="number" min="1" max="5" value={form.reliabilityRating} onChange={set("reliabilityRating")} />
          </Field>
        </Grid>
        <div className="mt-3 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.affiliateInterest} onChange={setChecked("affiliateInterest")} />
            Interested in affiliate deals
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.sampleInterest} onChange={setChecked("sampleInterest")} />
            Interested in samples/gifting
          </label>
        </div>
        <div className="mt-3">
          <Field label="Brand-safety notes">
            <textarea className="input min-h-[60px]" value={form.brandSafetyNotes} onChange={set("brandSafetyNotes")} />
          </Field>
        </div>
      </Section>

      <Section title="Pipeline">
        <Grid>
          <Field label="Assigned owner">
            <select className="input" value={form.ownerId} onChange={set("ownerId")}>
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Last contact"><input className="input" type="date" value={form.lastContactDate} onChange={set("lastContactDate")} /></Field>
          <Field label="Next follow-up"><input className="input" type="date" value={form.nextFollowUpDate} onChange={set("nextFollowUpDate")} /></Field>
          <Field label="Follow-up priority">
            <select className="input" value={form.followUpPriority} onChange={set("followUpPriority")}>
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Total earnings through Nexus"><input className="input" type="number" value={form.totalEarnings} onChange={set("totalEarnings")} /></Field>
        </Grid>
      </Section>

      <Section title="Notes">
        <Field label="General notes">
          <textarea className="input min-h-[60px]" value={form.notes} onChange={set("notes")} />
        </Field>
      </Section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending || !form.name.trim() || !form.contact.trim()}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
        {saved && <span className="text-xs text-emerald-400">Saved</span>}
      </div>

      <Section title="Call log">
        <div className="mb-2 flex gap-2">
          <input
            className="input-sm flex-1"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Log what happened..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNote();
              }
            }}
          />
          <button
            onClick={submitNote}
            disabled={pending || !noteDraft.trim()}
            className="shrink-0 rounded-md bg-amber-500 px-3 text-xs font-medium text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {callLogs.length === 0 ? (
          <p className="text-xs text-slate-600">No call notes yet.</p>
        ) : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {callLogs.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm text-slate-300">
                <Clock size={12} className="mt-1 shrink-0 text-slate-600" />
                <div className="min-w-0">
                  <span className="break-words">{c.text}</span>
                  <TimeAgo ts={c.created_at} className="ml-2 text-xs text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
