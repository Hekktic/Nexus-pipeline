"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import TimeAgo from "@/components/TimeAgo";
import { BRAND_STATUS_OPTIONS, brandStatusMeta } from "@/lib/constants";

export default function BrandsListView({ brands = [] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands.filter((b) => {
      if (!showArchived && b.is_archived) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.contact.toLowerCase().includes(q) ||
        (b.category || "").toLowerCase().includes(q)
      );
    });
  }, [brands, query, statusFilter, showArchived]);

  const archivedCount = brands.filter((b) => b.is_archived).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {BRAND_STATUS_OPTIONS.map((s) => (
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
        {filtered.length} of {brands.length} brands
      </p>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {brands.length === 0
            ? "No brands logged yet. Add one from the Log screen."
            : "Nothing matches those filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => {
            const meta = brandStatusMeta(b.status);
            return (
              <Link
                key={b.id}
                href={`/brands/${b.id}`}
                className={`flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900 px-3 py-2.5 transition-colors hover:border-slate-700 ${
                  b.is_archived ? "opacity-50" : ""
                }`}
              >
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-white ${meta.color}`}
                >
                  {meta.label}
                </span>
                {b.is_archived && (
                  <span className="shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                    Archived
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{b.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {b.category || "no category"} · {b.contact}
                  </p>
                </div>
                {b.owner && (
                  <span className="hidden shrink-0 text-xs text-slate-500 sm:inline">
                    {b.owner.display_name}
                  </span>
                )}
                <TimeAgo ts={b.updated_at} className="hidden shrink-0 text-xs text-slate-600 sm:inline" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
