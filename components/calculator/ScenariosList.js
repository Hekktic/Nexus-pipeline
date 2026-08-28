"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Copy, Pencil } from "lucide-react";
import { duplicateProfitScenario, setProfitScenarioArchived } from "@/app/actions";
import TimeAgo from "@/components/TimeAgo";

export default function ScenariosList({ scenarios = [], selectedIds, onToggleSelect, onEdit, onChanged }) {
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = scenarios.filter((s) => showArchived || s.status !== "archived");
  const archivedCount = scenarios.filter((s) => s.status === "archived").length;

  const duplicate = (id) => {
    setError("");
    startTransition(async () => {
      const result = await duplicateProfitScenario(id);
      if (!result?.ok) setError(result?.error || "Couldn't duplicate that scenario.");
      else onChanged?.();
    });
  };

  const toggleArchived = (id, isArchived) => {
    setError("");
    startTransition(async () => {
      const result = await setProfitScenarioArchived(id, isArchived);
      if (!result?.ok) setError(result?.error || "Couldn't update that scenario.");
      else onChanged?.();
    });
  };

  if (scenarios.length === 0) {
    return <p className="text-sm text-neutral-500">No saved scenarios yet — calculate one above and save it.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">Check up to 3 to compare them side by side.</p>
        {archivedCount > 0 && (
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="space-y-2">
        {visible.map((s) => {
          const checked = selectedIds.has(s.id);
          const disabledCheckbox = !checked && selectedIds.size >= 3;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 ${
                s.status === "archived" ? "opacity-50" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabledCheckbox}
                onChange={() => onToggleSelect(s.id)}
                title={disabledCheckbox ? "You can compare up to 3 at a time" : "Select for comparison"}
              />
              <span className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-300">
                {s.mode}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{s.name}</p>
                <p className="truncate text-xs text-neutral-500">
                  {s.brand?.name || s.creator?.name || "Not linked to a brand or creator"}
                </p>
              </div>
              <TimeAgo ts={s.updated_at} className="hidden shrink-0 text-xs text-neutral-600 sm:inline" />
              <button
                onClick={() => onEdit(s)}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => duplicate(s.id)}
                disabled={pending}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-50"
                title="Duplicate"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => toggleArchived(s.id, s.status !== "archived")}
                disabled={pending}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-50"
                title={s.status === "archived" ? "Restore" : "Archive"}
              >
                {s.status === "archived" ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
