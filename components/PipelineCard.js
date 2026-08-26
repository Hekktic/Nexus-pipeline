"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { addCallLog, setAssignedTo, updateEntryStatus } from "@/app/actions";
import TimeAgo from "@/components/TimeAgo";
import { STATUS_OPTIONS, statusMeta } from "@/lib/constants";

export default function PipelineCard({ entry, expanded, onToggle }) {
  const [noteDraft, setNoteDraft] = useState("");
  const [assigneeDraft, setAssigneeDraft] = useState(entry.assigned_to || "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const meta = statusMeta(entry.status);
  const callLogs = entry.call_logs ?? [];

  const run = (fn) => {
    setError("");
    startTransition(async () => {
      const result = await fn();
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  const changeStatus = (status) =>
    run(() => updateEntryStatus(entry.id, status));

  const setAssignee = () => run(() => setAssignedTo(entry.id, assigneeDraft));

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    setError("");
    startTransition(async () => {
      const result = await addCallLog(entry.id, text);
      if (result?.ok) setNoteDraft("");
      else setError(result?.error || "That didn't save. Try again.");
    });
  };

  return (
    <div
      className={`rounded-md border bg-slate-900 ${
        pending ? "border-slate-700 opacity-80" : "border-slate-800"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-white ${meta.color}`}
        >
          {meta.label}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{entry.name}</p>
          <p className="truncate text-xs text-slate-500">
            {entry.type === "creator" ? "Creator" : "Brand"} ·{" "}
            {entry.category || "no category"} · {entry.contact}
          </p>
        </div>

        <TimeAgo
          ts={entry.updated_at}
          className="hidden shrink-0 text-xs text-slate-600 sm:inline"
        />

        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-slate-500" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-slate-800 px-3 pb-3 pt-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Detail</p>
              <p className="break-words text-slate-200">{entry.detail || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Logged by</p>
              <p className="break-words text-slate-200">{entry.logged_by || "—"}</p>
            </div>
          </div>

          {entry.notes && (
            <div>
              <p className="text-xs text-slate-500">Original notes</p>
              <p className="whitespace-pre-wrap text-sm text-slate-300">
                {entry.notes}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="mb-1 text-xs text-slate-500">Status</p>
              <select
                className="input-sm"
                value={entry.status}
                disabled={pending}
                onChange={(e) => changeStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 text-xs text-slate-500">Assigned closer</p>
              <div className="flex items-center gap-1">
                <input
                  className="input-sm w-auto"
                  value={assigneeDraft}
                  onChange={(e) => setAssigneeDraft(e.target.value)}
                  placeholder="Name"
                />
                <button
                  onClick={setAssignee}
                  disabled={pending}
                  className="rounded-md bg-slate-700 px-2 py-1 text-xs text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-slate-500">Call log</p>
            <div className="mb-2 flex gap-2">
              <input
                className="input-sm flex-1"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Log what happened on the call..."
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
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
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
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
