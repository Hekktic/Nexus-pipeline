"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { addTag, removeTag } from "@/app/actions";

export default function TagsEditor({ subjectType, subjectId, tags = [], allTagNames = [] }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await addTag(subjectType, subjectId, name);
        if (result?.ok) setDraft("");
        else setError(result?.error || "Couldn't add that tag.");
      } catch (e) {
        setError(e?.message || "Couldn't add that tag.");
      }
    });
  };

  const remove = (contactTagId) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await removeTag(contactTagId);
        if (!result?.ok) setError(result?.error || "Couldn't remove that tag.");
      } catch (e) {
        setError(e?.message || "Couldn't remove that tag.");
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span
            key={t.contactTagId}
            className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300"
          >
            {t.name}
            <button
              onClick={() => remove(t.contactTagId)}
              disabled={pending}
              className="text-slate-500 hover:text-slate-200"
              title="Remove tag"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        <div className="flex items-center gap-1">
          <input
            list="tag-suggestions"
            className="input-sm w-32"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add tag..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
          <datalist id="tag-suggestions">
            {allTagNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <button
            onClick={submit}
            disabled={pending || !draft.trim()}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
            title="Add tag"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
