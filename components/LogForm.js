"use client";

import { useState, useTransition } from "react";
import { createEntry } from "@/app/actions";
import Field from "@/components/Field";
import TimeAgo from "@/components/TimeAgo";
import { statusMeta } from "@/lib/constants";

const EMPTY = {
  name: "",
  contact: "",
  category: "",
  detail: "",
  notes: "",
};

export default function LogForm({ recent = [] }) {
  const [type, setType] = useState("creator");
  const [form, setForm] = useState(EMPTY);
  const [loggedBy, setLoggedBy] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const valid = form.name.trim() && form.contact.trim() && loggedBy.trim();

  const submit = () => {
    setTouched(true);
    setError("");
    if (!valid || pending) return;

    startTransition(async () => {
      const result = await createEntry({ ...form, type, loggedBy });
      if (!result?.ok) {
        setError(result?.error || "Couldn't save that. Try again.");
        return;
      }
      setForm(EMPTY);
      setTouched(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <TypeToggle value="creator" current={type} onClick={setType} label="Creator" />
        <TypeToggle value="brand" current={type} onClick={setType} label="Brand" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Name"
          required
          error={touched && !form.name.trim() && "Enter a name"}
        >
          <input
            className="input"
            value={form.name}
            onChange={set("name")}
            placeholder={type === "creator" ? "@handle or full name" : "Brand name"}
          />
        </Field>

        <Field
          label={
            type === "creator"
              ? "Contact (email/phone/DM)"
              : "Contact (email/phone)"
          }
          required
          error={touched && !form.contact.trim() && "Enter contact info"}
        >
          <input
            className="input"
            value={form.contact}
            onChange={set("contact")}
            placeholder="email, phone, or IG handle"
          />
        </Field>

        <Field label={type === "creator" ? "Niche / category" : "Product category"}>
          <input
            className="input"
            value={form.category}
            onChange={set("category")}
            placeholder="e.g. fishing, skincare"
          />
        </Field>

        <Field
          label={type === "creator" ? "Followers / platform" : "Website / Shopify URL"}
        >
          <input
            className="input"
            value={form.detail}
            onChange={set("detail")}
            placeholder={type === "creator" ? "e.g. 40k TikTok" : "e.g. brand.com"}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          className="input min-h-[70px]"
          value={form.notes}
          onChange={set("notes")}
          placeholder="Anything the closer should know before calling"
        />
      </Field>

      <Field
        label="Logged by"
        required
        error={touched && !loggedBy.trim() && "Enter your name"}
      >
        <input
          className="input"
          value={loggedBy}
          onChange={(e) => setLoggedBy(e.target.value)}
          placeholder="Your name"
        />
      </Field>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={submit}
        disabled={pending}
        className="w-full rounded-md bg-amber-500 py-2.5 font-medium text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add to pipeline"}
      </button>

      {saved && (
        <p className="text-center text-xs text-emerald-400">Added to the pipeline</p>
      )}

      {recent.length > 0 && (
        <div className="border-t border-slate-800 pt-3">
          <p className="mb-2 text-xs text-slate-500">Recently added</p>
          <div className="space-y-1">
            {recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 text-sm text-slate-400"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusMeta(r.status).color}`}
                />
                <span className="truncate text-slate-200">{r.name}</span>
                <span className="text-slate-600">·</span>
                <span className="capitalize">{r.type}</span>
                <TimeAgo ts={r.created_at} className="ml-auto shrink-0 text-slate-600" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TypeToggle({ value, current, onClick, label }) {
  const active = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-700 text-white"
          : "border border-slate-800 bg-slate-900 text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
