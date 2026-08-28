"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import TimeAgo from "@/components/TimeAgo";
import { downloadCSV, toCSV } from "@/lib/csv";
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

  const exportCSV = () => {
    const rows = filtered.map((b) => ({
      name: b.name,
      contact: b.contact,
      website: b.website || "",
      category: b.category || "",
      status: b.status,
      owner: b.owner?.display_name || "",
      logged_by: b.logged_by || "",
      tags: (b.tags || []).map((t) => t.name).join("; "),
      is_archived: b.is_archived ? "yes" : "no",
      updated_at: b.updated_at,
    }));
    downloadCSV(`brands-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
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
          <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {filtered.length} of {brands.length} brands
        </p>
        {filtered.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200"
          >
            <Download size={12} /> Export CSV
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-500">
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
                className={`flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 transition-colors hover:border-neutral-700 ${
                  b.is_archived ? "opacity-50" : ""
                }`}
              >
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-white ${meta.color}`}
                >
                  {meta.label}
                </span>
                {b.is_archived && (
                  <span className="shrink-0 rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
                    Archived
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{b.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {b.category || "no category"} · {b.contact}
                  </p>
                </div>
                {(b.tags || []).length > 0 && (
                  <div className="hidden shrink-0 gap-1 md:flex">
                    {b.tags.slice(0, 3).map((t) => (
                      <span
                        key={t.contactTagId}
                        className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] text-neutral-400"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
                {b.owner && (
                  <span className="hidden shrink-0 text-xs text-neutral-500 sm:inline">
                    {b.owner.display_name}
                  </span>
                )}
                <TimeAgo ts={b.updated_at} className="hidden shrink-0 text-xs text-neutral-600 sm:inline" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
