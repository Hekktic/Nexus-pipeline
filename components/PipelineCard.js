"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Clock, ExternalLink } from "lucide-react";
import {
  addCallLog,
  updateBrandStatus,
  updateCreatorOnboardingStatus,
  updateCreatorVettingStatus,
} from "@/app/actions";
import TimeAgo from "@/components/TimeAgo";
import {
  BRAND_STATUS_OPTIONS,
  ONBOARDING_STATUS_OPTIONS,
  VETTING_STATUS_OPTIONS,
  brandStatusMeta,
  onboardingStatusMeta,
  vettingStatusMeta,
} from "@/lib/constants";

export default function PipelineCard({ entry, expanded, onToggle }) {
  const [noteDraft, setNoteDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const isBrand = entry.kind === "brand";
  const badgeMeta = isBrand ? brandStatusMeta(entry.status) : onboardingStatusMeta(entry.onboarding_status);
  const callLogs = entry.call_logs ?? [];

  const run = (fn) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  const changeBrandStatus = (status) => run(() => updateBrandStatus(entry.id, status));
  const changeVetting = (status) => run(() => updateCreatorVettingStatus(entry.id, status));
  const changeOnboarding = (status) => run(() => updateCreatorOnboardingStatus(entry.id, status));

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    setError("");
    startTransition(async () => {
      const result = await addCallLog(entry.kind, entry.id, text);
      if (result?.ok) setNoteDraft("");
      else setError(result?.error || "That didn't save. Try again.");
    });
  };

  const platformSummary = isBrand
    ? ""
    : Object.entries(entry.platforms || {})
        .map(([platform, followers]) => (followers ? `${platform} (${followers})` : platform))
        .join(", ");

  return (
    <div
      className={`rounded-md border bg-neutral-900 ${
        pending ? "border-neutral-700 opacity-80" : "border-neutral-800"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-white ${badgeMeta.color}`}
        >
          {badgeMeta.label}
        </span>

        {!isBrand && (
          <span
            className={`hidden shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-white sm:inline ${vettingStatusMeta(entry.vetting_status).color}`}
          >
            {vettingStatusMeta(entry.vetting_status).label}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{entry.name}</p>
          <p className="truncate text-xs text-neutral-500">
            {isBrand ? "Brand" : "Creator"} · {entry.category || "no category"} ·{" "}
            {isBrand ? entry.contact : platformSummary || entry.contact}
          </p>
        </div>

        {(entry.tags || []).length > 0 && (
          <div className="hidden shrink-0 gap-1 md:flex">
            {entry.tags.slice(0, 3).map((t) => (
              <span
                key={t.contactTagId}
                className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-400"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}

        <TimeAgo
          ts={entry.updated_at}
          className="hidden shrink-0 text-xs text-neutral-600 sm:inline"
        />

        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-neutral-500" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-neutral-500" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-neutral-800 px-3 pb-3 pt-3">
          <Link
            href={`/${entry.kind}s/${entry.id}`}
            className="link-accent flex items-center gap-1 text-xs"
          >
            View full profile <ExternalLink size={11} />
          </Link>

          {isBrand ? (
            <BrandDetail entry={entry} pending={pending} onChangeStatus={changeBrandStatus} />
          ) : (
            <CreatorDetail
              entry={entry}
              pending={pending}
              onChangeVetting={changeVetting}
              onChangeOnboarding={changeOnboarding}
            />
          )}

          <div>
            <p className="mb-1 text-xs text-neutral-500">Call log</p>
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
                className="btn-accent shrink-0 rounded-md px-3 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {callLogs.length === 0 ? (
              <p className="text-xs text-neutral-600">No call notes yet.</p>
            ) : (
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {callLogs.map((c) => (
                  <div key={c.id} className="flex gap-2 text-sm text-neutral-300">
                    <Clock size={12} className="mt-1 shrink-0 text-neutral-600" />
                    <div className="min-w-0">
                      <span className="break-words">{c.text}</span>
                      <TimeAgo ts={c.created_at} className="ml-2 text-xs text-neutral-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}

function BrandDetail({ entry, pending, onChangeStatus }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-neutral-500">Website</p>
          <p className="break-words text-neutral-200">{entry.website || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Logged by</p>
          <p className="break-words text-neutral-200">{entry.logged_by || "—"}</p>
        </div>
      </div>

      {entry.margin_notes && (
        <div>
          <p className="text-xs text-neutral-500">Margin notes</p>
          <p className="whitespace-pre-wrap text-sm text-neutral-300">{entry.margin_notes}</p>
        </div>
      )}

      {entry.fulfillment_notes && (
        <div>
          <p className="text-xs text-neutral-500">Fulfillment notes</p>
          <p className="whitespace-pre-wrap text-sm text-neutral-300">{entry.fulfillment_notes}</p>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs text-neutral-500">Status</p>
        <select
          className="input-sm"
          value={entry.status}
          disabled={pending}
          onChange={(e) => onChangeStatus(e.target.value)}
        >
          {BRAND_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function CreatorDetail({ entry, pending, onChangeVetting, onChangeOnboarding }) {
  const platforms = Object.entries(entry.platforms || {});

  return (
    <>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-neutral-500">Contact</p>
          <p className="break-words text-neutral-200">{entry.contact || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Logged by</p>
          <p className="break-words text-neutral-200">{entry.logged_by || "—"}</p>
        </div>
      </div>

      {platforms.length > 0 && (
        <div>
          <p className="text-xs text-neutral-500">Platforms</p>
          <p className="text-sm text-neutral-200">
            {platforms.map(([p, count]) => (count ? `${p} (${count})` : p)).join(", ")}
          </p>
        </div>
      )}

      {entry.audience_demographics && (
        <div>
          <p className="text-xs text-neutral-500">Audience demographics</p>
          <p className="whitespace-pre-wrap text-sm text-neutral-300">{entry.audience_demographics}</p>
        </div>
      )}

      {entry.pricing_expectations && (
        <div>
          <p className="text-xs text-neutral-500">Pricing expectations</p>
          <p className="text-sm text-neutral-300">{entry.pricing_expectations}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div>
          <p className="mb-1 text-xs text-neutral-500">Vetting</p>
          <select
            className="input-sm"
            value={entry.vetting_status}
            disabled={pending}
            onChange={(e) => onChangeVetting(e.target.value)}
          >
            {VETTING_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1 text-xs text-neutral-500">Onboarding</p>
          <select
            className="input-sm"
            value={entry.onboarding_status}
            disabled={pending}
            onChange={(e) => onChangeOnboarding(e.target.value)}
          >
            {ONBOARDING_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
