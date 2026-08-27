"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, CheckCircle2, Clock, Plus, Tag, TrendingUp } from "lucide-react";
import { addCallLog } from "@/app/actions";
import TimeAgo from "@/components/TimeAgo";

const ICONS = {
  created: Plus,
  status_changed: TrendingUp,
  vetting_status_changed: CheckCircle2,
  onboarding_status_changed: CheckCircle2,
  archived: Archive,
  restored: ArchiveRestore,
  tag_added: Tag,
  tag_removed: Tag,
  profile_updated: Clock,
};

/** Merged call-note + activity feed for one brand or creator, with the input to add a new note. */
export default function Timeline({ subjectType, subjectId, timeline = [] }) {
  const [noteDraft, setNoteDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await addCallLog(subjectType, subjectId, text);
        if (result?.ok) setNoteDraft("");
        else setError(result?.error || "That didn't save. Try again.");
      } catch (e) {
        setError(e?.message || "That didn't save. Try again.");
      }
    });
  };

  return (
    <div>
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
          className="shrink-0 rounded-md bg-amber-500 px-3 text-xs font-medium text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      {timeline.length === 0 ? (
        <p className="text-xs text-slate-600">Nothing logged yet.</p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {timeline.map((item) => {
            const Icon = item.kind === "note" ? Clock : ICONS[item.type] || Clock;
            return (
              <div key={`${item.kind}-${item.id}`} className="flex gap-2 text-sm">
                <Icon
                  size={12}
                  className={`mt-1 shrink-0 ${item.kind === "note" ? "text-slate-600" : "text-amber-500"}`}
                />
                <div className="min-w-0">
                  <span
                    className={
                      item.kind === "note"
                        ? "break-words text-slate-300"
                        : "break-words italic text-slate-500"
                    }
                  >
                    {item.label}
                  </span>
                  <TimeAgo ts={item.created_at} className="ml-2 text-xs text-slate-600" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
