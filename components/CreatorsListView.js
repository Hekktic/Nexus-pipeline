"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import TimeAgo from "@/components/TimeAgo";
import {
  ONBOARDING_STATUS_OPTIONS,
  VETTING_STATUS_OPTIONS,
  onboardingStatusMeta,
  vettingStatusMeta,
} from "@/lib/constants";

export default function CreatorsListView({ creators = [] }) {
  const [query, setQuery] = useState("");
  const [vettingFilter, setVettingFilter] = useState("all");
  const [onboardingFilter, setOnboardingFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creators.filter((c) => {
      if (!showArchived && c.is_archived) return false;
      if (vettingFilter !== "all" && c.vetting_status !== vettingFilter) return false;
      if (onboardingFilter !== "all" && c.onboarding_status !== onboardingFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q)
      );
    });
  }, [creators, query, vettingFilter, onboardingFilter, showArchived]);

  const archivedCount = creators.filter((c) => c.is_archived).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input
            className="input pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, contact, category"
          />
        </div>
        <select
          className="input w-auto"
          value={vettingFilter}
          onChange={(e) => setVettingFilter(e.target.value)}
        >
          <option value="all">All vetting</option>
          {VETTING_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={onboardingFilter}
          onChange={(e) => setOnboardingFilter(e.target.value)}
        >
          <option value="all">All onboarding</option>
          {ONBOARDING_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {archivedCount > 0 && (
          <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} of {creators.length} creators
      </p>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {creators.length === 0
            ? "No creators logged yet. Add one from the Log screen."
            : "Nothing matches those filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const onboarding = onboardingStatusMeta(c.onboarding_status);
            const vetting = vettingStatusMeta(c.vetting_status);
            return (
              <Link
                key={c.id}
                href={`/creators/${c.id}`}
                className={`flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900 px-3 py-2.5 transition-colors hover:border-slate-700 ${
                  c.is_archived ? "opacity-50" : ""
                }`}
              >
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-white ${onboarding.color}`}
                >
                  {onboarding.label}
                </span>
                <span
                  className={`hidden shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-white sm:inline ${vetting.color}`}
                >
                  {vetting.label}
                </span>
                {c.is_archived && (
                  <span className="shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                    Archived
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {c.category || "no category"} · {c.contact}
                  </p>
                </div>
                {c.owner && (
                  <span className="hidden shrink-0 text-xs text-slate-500 sm:inline">
                    {c.owner.display_name}
                  </span>
                )}
                <TimeAgo ts={c.updated_at} className="hidden shrink-0 text-xs text-slate-600 sm:inline" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
