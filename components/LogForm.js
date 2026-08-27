"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { createBrand, createCreator } from "@/app/actions";
import Field from "@/components/Field";
import TimeAgo from "@/components/TimeAgo";
import {
  brandStatusMeta,
  onboardingStatusMeta,
} from "@/lib/constants";

const EMPTY_CREATOR = {
  name: "",
  contact: "",
  platforms: [{ platform: "", followers: "" }],
  category: "",
  audienceDemographics: "",
  pricingExpectations: "",
};

const EMPTY_BRAND = {
  name: "",
  contact: "",
  website: "",
  category: "",
  marginNotes: "",
  fulfillmentNotes: "",
};

export default function LogForm({ recent = [] }) {
  const [type, setType] = useState("creator");
  const [creator, setCreator] = useState(EMPTY_CREATOR);
  const [brand, setBrand] = useState(EMPTY_BRAND);
  const [loggedBy, setLoggedBy] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [duplicateMatches, setDuplicateMatches] = useState(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = type === "creator" ? creator : brand;
  const setForm = type === "creator" ? setCreator : setBrand;
  const set = (key) => (e) => {
    setDuplicateMatches(null);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const valid = form.name.trim() && form.contact.trim() && loggedBy.trim();

  const setPlatformRow = (i, key) => (e) =>
    setCreator((c) => ({
      ...c,
      platforms: c.platforms.map((row, idx) =>
        idx === i ? { ...row, [key]: e.target.value } : row
      ),
    }));

  const addPlatformRow = () =>
    setCreator((c) => ({
      ...c,
      platforms: [...c.platforms, { platform: "", followers: "" }],
    }));

  const removePlatformRow = (i) =>
    setCreator((c) => ({
      ...c,
      platforms: c.platforms.filter((_, idx) => idx !== i),
    }));

  const submit = (confirmDuplicate = false) => {
    setTouched(true);
    setError("");
    if (!confirmDuplicate) setDuplicateMatches(null);
    if (!valid || pending) return;

    startTransition(async () => {
      const result =
        type === "creator"
          ? await createCreator({ ...creator, loggedBy, confirmDuplicate })
          : await createBrand({ ...brand, loggedBy, confirmDuplicate });

      if (!result?.ok) {
        if (result?.duplicate) {
          setDuplicateMatches(result.matches || []);
          setError(result?.error || "This might already exist.");
        } else {
          setDuplicateMatches(null);
          setError(result?.error || "Couldn't save that. Try again.");
        }
        return;
      }
      setCreator(EMPTY_CREATOR);
      setBrand(EMPTY_BRAND);
      setTouched(false);
      setDuplicateMatches(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <TypeToggle value="creator" current={type} onClick={setType} label="Creator" />
        <TypeToggle value="brand" current={type} onClick={setType} label="Brand" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Name"
          required
          error={touched && !form.name.trim() && "Enter a name"}
        >
          <input
            className="input"
            value={form.name}
            onChange={set("name")}
            placeholder={type === "creator" ? "@handle or full name" : "Brand name"}
          />
        </Field>

        <Field
          label={type === "creator" ? "Contact (email/phone/DM)" : "Contact (email/phone)"}
          required
          error={touched && !form.contact.trim() && "Enter contact info"}
        >
          <input
            className="input"
            value={form.contact}
            onChange={set("contact")}
            placeholder="email, phone, or IG handle"
          />
        </Field>

        <Field label={type === "creator" ? "Content category" : "Product category"}>
          <input
            className="input"
            value={form.category}
            onChange={set("category")}
            placeholder="e.g. fishing, skincare"
          />
        </Field>

        {type === "brand" && (
          <Field label="Website / Shopify URL">
            <input
              className="input"
              value={brand.website}
              onChange={set("website")}
              placeholder="e.g. brand.com"
            />
          </Field>
        )}
      </div>

      {type === "creator" ? (
        <>
          <Field label="Platforms & follower counts">
            <div className="space-y-2">
              {creator.platforms.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input"
                    value={row.platform}
                    onChange={setPlatformRow(i, "platform")}
                    placeholder="e.g. TikTok"
                  />
                  <input
                    className="input"
                    value={row.followers}
                    onChange={setPlatformRow(i, "followers")}
                    placeholder="e.g. 40k"
                  />
                  <button
                    type="button"
                    onClick={() => removePlatformRow(i)}
                    disabled={creator.platforms.length === 1}
                    className="shrink-0 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
                    title="Remove platform"
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
                <Plus size={12} /> Add platform
              </button>
            </div>
          </Field>

          <Field label="Audience demographics">
            <textarea
              className="input min-h-[60px]"
              value={creator.audienceDemographics}
              onChange={set("audienceDemographics")}
              placeholder="e.g. 70% female, 18-24, US-based"
            />
          </Field>

          <Field label="Pricing expectations">
            <input
              className="input"
              value={creator.pricingExpectations}
              onChange={set("pricingExpectations")}
              placeholder="e.g. $500/video, open to gifting"
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="Margin notes">
            <textarea
              className="input min-h-[60px]"
              value={brand.marginNotes}
              onChange={set("marginNotes")}
              placeholder="Margins, commission expectations, etc."
            />
          </Field>

          <Field label="Fulfillment notes">
            <textarea
              className="input min-h-[60px]"
              value={brand.fulfillmentNotes}
              onChange={set("fulfillmentNotes")}
              placeholder="How product/samples get to creators"
            />
          </Field>
        </>
      )}

      <Field
        label="Logged by"
        required
        error={touched && !loggedBy.trim() && "Enter your name"}
      >
        <input
          className="input"
          value={loggedBy}
          onChange={(e) => setLoggedBy(e.target.value)}
          placeholder="Your name"
        />
      </Field>

      {error && !duplicateMatches && <p className="text-sm text-red-400">{error}</p>}

      {duplicateMatches && (
        <div className="rounded-md border border-amber-800 bg-amber-950/40 p-3">
          <p className="mb-2 text-sm text-amber-300">{error}</p>
          <div className="mb-3 space-y-1">
            {duplicateMatches.map((m) => (
              <Link
                key={m.id}
                href={`/${m.kind}s/${m.id}`}
                className="block text-xs text-amber-400 underline hover:text-amber-300"
              >
                View existing: {m.name} ({m.contact})
              </Link>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => submit(true)}
              disabled={pending}
              className="rounded-md border border-amber-700 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-900 disabled:opacity-50"
            >
              Add anyway
            </button>
            <button
              onClick={() => setDuplicateMatches(null)}
              className="rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => submit(false)}
        disabled={pending}
        className="w-full rounded-md bg-amber-500 py-2.5 font-medium text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add to pipeline"}
      </button>

      {saved && (
        <p className="text-center text-xs text-emerald-400">Added to the pipeline</p>
      )}

      {recent.length > 0 && (
        <div className="border-t border-slate-800 pt-3">
          <p className="mb-2 text-xs text-slate-500">Recently added</p>
          <div className="space-y-1">
            {recent.map((r) => {
              const meta =
                r.kind === "brand" ? brandStatusMeta(r.status) : onboardingStatusMeta(r.onboarding_status);
              return (
                <div
                  key={`${r.kind}-${r.id}`}
                  className="flex items-center gap-2 text-sm text-slate-400"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.color}`} />
                  <span className="truncate text-slate-200">{r.name}</span>
                  <span className="text-slate-600">·</span>
                  <span className="capitalize">{r.kind}</span>
                  <TimeAgo ts={r.created_at} className="ml-auto shrink-0 text-slate-600" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TypeToggle({ value, current, onClick, label }) {
  const active = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-700 text-white"
          : "border border-slate-800 bg-slate-900 text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
