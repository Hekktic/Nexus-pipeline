"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, ArchiveRestore, Plus, X } from "lucide-react";
import { setBrandArchived, updateBrand, updateBrandStatus } from "@/app/actions";
import Field from "@/components/Field";
import RelatedDealsSection from "@/components/RelatedDealsSection";
import TagsEditor from "@/components/TagsEditor";
import TimeAgo from "@/components/TimeAgo";
import Timeline from "@/components/Timeline";
import { BRAND_STATUS_OPTIONS } from "@/lib/constants";

function toFormState(brand) {
  const socialLinks = Object.entries(brand.social_links || {});
  return {
    name: brand.name || "",
    contact: brand.contact || "",
    website: brand.website || "",
    category: brand.category || "",
    primaryContactName: brand.primary_contact_name || "",
    contactTitle: brand.contact_title || "",
    email: brand.email || "",
    phone: brand.phone || "",
    products: brand.products || "",
    avgProductPrice: brand.avg_product_price ?? "",
    targetCustomer: brand.target_customer || "",
    preferredNiches: brand.preferred_niches || "",
    preferredPlatforms: brand.preferred_platforms || "",
    campaignObjectives: brand.campaign_objectives || "",
    budget: brand.budget || "",
    commissionRange: brand.commission_range || "",
    sampleAvailability: brand.sample_availability || "",
    marginNotes: brand.margin_notes || "",
    fulfillmentNotes: brand.fulfillment_notes || "",
    notes: brand.notes || "",
    ownerId: brand.owner_id || "",
    lastContactDate: brand.last_contact_date || "",
    nextFollowUpDate: brand.next_follow_up_date || "",
    estimatedDealValue: brand.estimated_deal_value ?? "",
    preferredContactMethod: brand.preferred_contact_method || "",
    followUpPriority: brand.follow_up_priority || "",
    socialLinks: socialLinks.length ? socialLinks.map(([platform, url]) => ({ platform, url })) : [{ platform: "", url: "" }],
  };
}

export default function BrandProfile({ brand, teamMembers = [], timeline = [], tags = [], allTagNames = [], deals = [] }) {
  const [form, setForm] = useState(() => toFormState(brand));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setSocialRow = (i, key) => (e) =>
    setForm((f) => ({
      ...f,
      socialLinks: f.socialLinks.map((row, idx) => (idx === i ? { ...row, [key]: e.target.value } : row)),
    }));

  const addSocialRow = () =>
    setForm((f) => ({ ...f, socialLinks: [...f.socialLinks, { platform: "", url: "" }] }));

  const removeSocialRow = (i) =>
    setForm((f) => ({ ...f, socialLinks: f.socialLinks.filter((_, idx) => idx !== i) }));

  const toggleArchived = () => {
    startTransition(async () => {
      const result = await setBrandArchived(brand.id, !brand.is_archived);
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  const save = () => {
    setError("");
    startTransition(async () => {
      const result = await updateBrand(brand.id, form);
      if (!result?.ok) {
        setError(result?.error || "Couldn't save that. Try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const changeStatus = (status) => {
    startTransition(async () => {
      const result = await updateBrandStatus(brand.id, status);
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  return (
    <div className="space-y-6">
      <Link href="/brands" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={14} /> Back to brands
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white">
            {brand.name}
            {brand.is_archived && (
              <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                Archived
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            Logged by {brand.logged_by || "—"} · Updated <TimeAgo ts={brand.updated_at} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input-sm"
            value={brand.status}
            disabled={pending}
            onChange={(e) => changeStatus(e.target.value)}
          >
            {BRAND_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={toggleArchived}
            disabled={pending}
            title={brand.is_archived ? "Restore to active views" : "Hide from active views"}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200 disabled:opacity-50"
          >
            {brand.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {brand.is_archived ? "Restore" : "Archive"}
          </button>
        </div>
      </div>

      <TagsEditor subjectType="brand" subjectId={brand.id} tags={tags} allTagNames={allTagNames} />

      <RelatedDealsSection deals={deals} />

      <Section title="Contact">
        <Grid>
          <Field label="Brand name" required><input className="input" value={form.name} onChange={set("name")} /></Field>
          <Field label="Contact info" required><input className="input" value={form.contact} onChange={set("contact")} placeholder="email or phone" /></Field>
          <Field label="Primary contact name"><input className="input" value={form.primaryContactName} onChange={set("primaryContactName")} /></Field>
          <Field label="Contact title"><input className="input" value={form.contactTitle} onChange={set("contactTitle")} /></Field>
          <Field label="Email"><input className="input" value={form.email} onChange={set("email")} /></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={set("phone")} /></Field>
          <Field label="Website / Shopify URL"><input className="input" value={form.website} onChange={set("website")} /></Field>
          <Field label="Preferred contact method"><input className="input" value={form.preferredContactMethod} onChange={set("preferredContactMethod")} placeholder="e.g. email, phone, Slack" /></Field>
        </Grid>

        <Field label="Social links">
          <div className="space-y-2">
            {form.socialLinks.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input className="input" value={row.platform} onChange={setSocialRow(i, "platform")} placeholder="e.g. Instagram" />
                <input className="input" value={row.url} onChange={setSocialRow(i, "url")} placeholder="Profile URL" />
                <button
                  type="button"
                  onClick={() => removeSocialRow(i)}
                  disabled={form.socialLinks.length === 1}
                  className="shrink-0 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSocialRow}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            >
              <Plus size={12} /> Add social link
            </button>
          </div>
        </Field>
      </Section>

      <Section title="Company">
        <Grid>
          <Field label="Industry / category"><input className="input" value={form.category} onChange={set("category")} /></Field>
          <Field label="Products"><input className="input" value={form.products} onChange={set("products")} /></Field>
          <Field label="Average product price"><input className="input" type="number" value={form.avgProductPrice} onChange={set("avgProductPrice")} /></Field>
          <Field label="Target customer"><input className="input" value={form.targetCustomer} onChange={set("targetCustomer")} /></Field>
          <Field label="Preferred creator niches"><input className="input" value={form.preferredNiches} onChange={set("preferredNiches")} /></Field>
          <Field label="Preferred platforms"><input className="input" value={form.preferredPlatforms} onChange={set("preferredPlatforms")} /></Field>
        </Grid>
      </Section>

      <Section title="Commercial">
        <Grid>
          <Field label="Campaign objectives"><input className="input" value={form.campaignObjectives} onChange={set("campaignObjectives")} /></Field>
          <Field label="Monthly / campaign budget"><input className="input" value={form.budget} onChange={set("budget")} /></Field>
          <Field label="Commission range"><input className="input" value={form.commissionRange} onChange={set("commissionRange")} /></Field>
          <Field label="Sample availability"><input className="input" value={form.sampleAvailability} onChange={set("sampleAvailability")} /></Field>
          <Field label="Estimated deal value"><input className="input" type="number" value={form.estimatedDealValue} onChange={set("estimatedDealValue")} /></Field>
        </Grid>
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
        </Grid>
      </Section>

      <Section title="Notes">
        <div className="space-y-3">
          <Field label="Margin notes"><textarea className="input min-h-[60px]" value={form.marginNotes} onChange={set("marginNotes")} /></Field>
          <Field label="Fulfillment notes"><textarea className="input min-h-[60px]" value={form.fulfillmentNotes} onChange={set("fulfillmentNotes")} /></Field>
          <Field label="General notes"><textarea className="input min-h-[60px]" value={form.notes} onChange={set("notes")} /></Field>
        </div>
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

      <Section title="Activity">
        <Timeline subjectType="brand" subjectId={brand.id} timeline={timeline} />
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
