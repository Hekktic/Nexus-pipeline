"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import PipelineCard from "@/components/PipelineCard";
import { downloadCSV, toCSV } from "@/lib/csv";
import {
  BRAND_STATUS_OPTIONS,
  ONBOARDING_STATUS_OPTIONS,
  VETTING_STATUS_OPTIONS,
} from "@/lib/constants";

export default function PipelineView({ entries = [], allTagNames = [] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [brandStatusFilter, setBrandStatusFilter] = useState("all");
  const [vettingFilter, setVettingFilter] = useState("all");
  const [onboardingFilter, setOnboardingFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return entries.filter((e) => {
      if (typeFilter !== "all" && e.kind !== typeFilter) return false;
      if (e.kind === "brand" && brandStatusFilter !== "all" && e.status !== brandStatusFilter) return false;
      if (e.kind === "creator" && vettingFilter !== "all" && e.vetting_status !== vettingFilter) return false;
      if (e.kind === "creator" && onboardingFilter !== "all" && e.onboarding_status !== onboardingFilter) return false;
      if (tagFilter !== "all" && !(e.tags || []).some((t) => t.name === tagFilter)) return false;
      if (!q) return true;

      return (
        e.name.toLowerCase().includes(q) ||
        e.contact.toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q)
      );
    });
  }, [entries, query, typeFilter, brandStatusFilter, vettingFilter, onboardingFilter, tagFilter]);

  const exportCSV = () => {
    const rows = filtered.map((e) => ({
      type: e.kind,
      name: e.name,
      contact: e.contact,
      category: e.category || "",
      status: e.kind === "brand" ? e.status : "",
      vetting_status: e.kind === "creator" ? e.vetting_status : "",
      onboarding_status: e.kind === "creator" ? e.onboarding_status : "",
      logged_by: e.logged_by || "",
      tags: (e.tags || []).map((t) => t.name).join("; "),
      updated_at: e.updated_at,
    }));
    downloadCSV(`contacts-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  };

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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="creator">Creators</option>
          <option value="brand">Brands</option>
        </select>

        {typeFilter === "brand" && (
          <select
            className="input w-auto"
            value={brandStatusFilter}
            onChange={(e) => setBrandStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {BRAND_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        {typeFilter === "creator" && (
          <>
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
          </>
        )}

        {allTagNames.length > 0 && (
          <select
            className="input w-auto"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="all">All tags</option>
            {allTagNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {filtered.length} of {entries.length} contacts
        </p>
        {filtered.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            <Download size={12} /> Export CSV
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {entries.length === 0
            ? "No contacts logged yet. Add them from the Log screen."
            : "Nothing matches those filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <PipelineCard
              key={`${e.kind}-${e.id}`}
              entry={e}
              expanded={expanded === `${e.kind}-${e.id}`}
              onToggle={() =>
                setExpanded(expanded === `${e.kind}-${e.id}` ? null : `${e.kind}-${e.id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
