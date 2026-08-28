"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, Plus, Search } from "lucide-react";
import { createDeal } from "@/app/actions";
import Field from "@/components/Field";
import TimeAgo from "@/components/TimeAgo";
import { downloadCSV, toCSV } from "@/lib/csv";
import { DEAL_STAGE_OPTIONS, dealStageMeta, isOverdue } from "@/lib/constants";

export default function DealsListView({ deals = [], brands = [], creators = [], teamMembers = [] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((d) => {
      if (stageFilter !== "all" && d.stage !== stageFilter) return false;
      if (ownerFilter !== "all" && d.owner_id !== ownerFilter) return false;
      if (!q) return true;
      return d.subject.name.toLowerCase().includes(q);
    });
  }, [deals, query, stageFilter, ownerFilter]);

  const exportCSV = () => {
    const rows = filtered.map((d) => ({
      subject_type: d.subject_type,
      subject_name: d.subject.name,
      stage: d.stage,
      deal_value: d.deal_value ?? "",
      probability: d.probability ?? "",
      expected_close_date: d.expected_close_date || "",
      owner: d.owner?.display_name || "",
      next_action: d.next_action || "",
      next_follow_up_date: d.next_follow_up_date || "",
      lost_reason: d.lost_reason || "",
      updated_at: d.updated_at,
    }));
    downloadCSV(`deals-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
          <input
            className="input pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand/creator name"
          />
        </div>

        <select className="input w-auto" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="all">All stages</option>
          {DEAL_STAGE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {teamMembers.length > 0 && (
          <select className="input w-auto" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="all">All owners</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => setShowCreate((v) => !v)}
          className="btn-accent flex items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors"
        >
          <Plus size={14} /> New deal
        </button>
      </div>

      {showCreate && (
        <NewDealForm
          brands={brands}
          creators={creators}
          onCreated={() => {
            setShowCreate(false);
            router.refresh();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {filtered.length} of {deals.length} deals
        </p>
        {filtered.length > 0 && (
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200">
            <Download size={12} /> Export CSV
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-500">
          {deals.length === 0 ? "No deals yet — start one above." : "Nothing matches those filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const meta = dealStageMeta(d.stage);
            const overdue = isOverdue(d.next_follow_up_date);
            return (
              <Link
                key={d.id}
                href={`/deals/${d.id}`}
                className="flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 transition-colors hover:border-neutral-700"
              >
                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-white ${meta.color}`}>
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{d.subject.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {d.subject_type} · {d.deal_value ? `$${Number(d.deal_value).toLocaleString()}` : "no value set"}
                    {d.probability !== null && d.probability !== undefined ? ` · ${d.probability}%` : ""}
                  </p>
                </div>
                {overdue && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-red-400" title="Follow-up overdue">
                    <AlertTriangle size={12} /> Overdue
                  </span>
                )}
                {d.owner && (
                  <span className="hidden shrink-0 text-xs text-neutral-500 sm:inline">{d.owner.display_name}</span>
                )}
                <TimeAgo ts={d.updated_at} className="hidden shrink-0 text-xs text-neutral-600 sm:inline" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewDealForm({ brands, creators, onCreated, onCancel }) {
  const [subjectType, setSubjectType] = useState("brand");
  const [subjectId, setSubjectId] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [probability, setProbability] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const options = subjectType === "brand" ? brands : creators;

  const submit = () => {
    setError("");
    if (!subjectId) {
      setError("Choose a brand or creator.");
      return;
    }
    startTransition(async () => {
      const result = await createDeal({ subjectType, subjectId, dealValue, probability, expectedCloseDate });
      if (!result?.ok) {
        setError(result?.error || "Couldn't create that deal.");
        return;
      }
      onCreated?.();
    });
  };

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-3 flex gap-2">
        <TypeToggle value="brand" current={subjectType} onClick={(v) => { setSubjectType(v); setSubjectId(""); }} label="Brand" />
        <TypeToggle value="creator" current={subjectType} onClick={(v) => { setSubjectType(v); setSubjectId(""); }} label="Creator" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={subjectType === "brand" ? "Brand" : "Creator"} required>
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select...</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Deal value">
          <input className="input" type="number" min="0" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="$" />
        </Field>
        <Field label="Probability %">
          <input className="input" type="number" min="0" max="100" value={probability} onChange={(e) => setProbability(e.target.value)} />
        </Field>
        <Field label="Expected close date">
          <input className="input" type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
        </Field>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={submit}
          disabled={pending}
          className="btn-accent rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create deal"}
        </button>
        <button onClick={onCancel} className="rounded-md px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200">
          Cancel
        </button>
      </div>
    </div>
  );
}

function TypeToggle({ value, current, onClick, label }) {
  const active = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
        active ? "bg-neutral-700 text-white" : "border border-neutral-800 bg-neutral-900 text-neutral-500"
      }`}
    >
      {label}
    </button>
  );
}
