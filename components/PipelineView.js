"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import PipelineCard from "@/components/PipelineCard";
import { STATUS_OPTIONS } from "@/lib/constants";

export default function PipelineView({ entries = [], currentUserId }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return entries.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (mineOnly && e.assigned_to !== currentUserId) return false;
      if (!q) return true;

      return (
        e.name.toLowerCase().includes(q) ||
        e.contact.toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q)
      );
    });
  }, [entries, query, typeFilter, statusFilter, mineOnly, currentUserId]);

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
          <option value="all">All types</option>
          <option value="creator">Creators</option>
          <option value="brand">Brands</option>
        </select>

        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setMineOnly((v) => !v)}
          className={`rounded-md border px-3 text-sm transition-colors ${
            mineOnly
              ? "border-amber-500 bg-amber-500 text-slate-950"
              : "border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200"
          }`}
        >
          Mine
        </button>
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} of {entries.length} contacts
      </p>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {entries.length === 0
            ? "No contacts logged yet. Loggers add them from their own screen."
            : "Nothing matches those filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <PipelineCard
              key={e.id}
              entry={e}
              currentUserId={currentUserId}
              expanded={expanded === e.id}
              onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
