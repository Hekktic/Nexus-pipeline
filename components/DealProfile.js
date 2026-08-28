"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { updateDeal, updateDealStage } from "@/app/actions";
import Field from "@/components/Field";
import TagsEditor from "@/components/TagsEditor";
import TimeAgo from "@/components/TimeAgo";
import Timeline from "@/components/Timeline";
import { DEAL_STAGE_OPTIONS, dealStageMeta, isOverdue } from "@/lib/constants";

function toFormState(deal) {
  return {
    dealValue: deal.deal_value ?? "",
    probability: deal.probability ?? "",
    expectedCloseDate: deal.expected_close_date || "",
    ownerId: deal.owner_id || "",
    nextAction: deal.next_action || "",
    nextFollowUpDate: deal.next_follow_up_date || "",
  };
}

export default function DealProfile({ deal, subject, teamMembers = [], timeline = [], tags = [], allTagNames = [] }) {
  const [form, setForm] = useState(() => toFormState(deal));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pendingLostReason, setPendingLostReason] = useState(null); // null = not prompting, "" or text = draft reason
  const [pending, startTransition] = useTransition();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const changeStage = (stage) => {
    if (stage === "lost") {
      setPendingLostReason("");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await updateDealStage(deal.id, stage, null);
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
    });
  };

  const confirmLostStage = () => {
    setError("");
    startTransition(async () => {
      const result = await updateDealStage(deal.id, "lost", pendingLostReason);
      if (!result?.ok) setError(result?.error || "That didn't save. Try again.");
      else setPendingLostReason(null);
    });
  };

  const save = () => {
    setError("");
    startTransition(async () => {
      const result = await updateDeal(deal.id, form);
      if (!result?.ok) {
        setError(result?.error || "Couldn't save that. Try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const meta = dealStageMeta(deal.stage);
  const overdue = isOverdue(deal.next_follow_up_date);

  return (
    <div className="space-y-6">
      <Link href="/pipeline" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200">
        <ArrowLeft size={14} /> Back to pipeline
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">
            {subject ? (
              <Link href={`/${deal.subject_type}s/${subject.id}`} className="hover:underline">
                {subject.name}
              </Link>
            ) : (
              "Unknown subject"
            )}
          </h1>
          <p className="text-xs text-neutral-500">
            {deal.subject_type} deal · Updated <TimeAgo ts={deal.updated_at} />
          </p>
        </div>
        <select
          className="input-sm"
          value={deal.stage}
          disabled={pending}
          onChange={(e) => changeStage(e.target.value)}
        >
          {DEAL_STAGE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {pendingLostReason !== null && (
        <div className="rounded-md border border-red-900 bg-red-950/30 p-3">
          <Field label="Why was this deal lost?">
            <input
              className="input-sm w-full"
              value={pendingLostReason}
              onChange={(e) => setPendingLostReason(e.target.value)}
              placeholder="e.g. went with a competitor, budget fell through"
              autoFocus
            />
          </Field>
          <div className="mt-2 flex gap-2">
            <button
              onClick={confirmLostStage}
              disabled={pending}
              className="rounded-md bg-red-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Mark as lost
            </button>
            <button
              onClick={() => setPendingLostReason(null)}
              className="rounded-md px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {deal.stage === "lost" && deal.lost_reason && (
        <p className="text-sm text-neutral-400">
          <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] uppercase text-white ${meta.color}`}>{meta.label}</span>
          {deal.lost_reason}
        </p>
      )}

      <TagsEditor subjectType="deal" subjectId={deal.id} tags={tags} allTagNames={allTagNames} />

      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Deal details</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Deal value">
            <input className="input" type="number" min="0" value={form.dealValue} onChange={set("dealValue")} placeholder="$" />
          </Field>
          <Field label="Probability %">
            <input className="input" type="number" min="0" max="100" value={form.probability} onChange={set("probability")} />
          </Field>
          <Field label="Expected close date">
            <input className="input" type="date" value={form.expectedCloseDate} onChange={set("expectedCloseDate")} />
          </Field>
          <Field label="Assigned owner">
            <select className="input" value={form.ownerId} onChange={set("ownerId")}>
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
          </Field>
          <Field label={overdue ? "Next follow-up (overdue)" : "Next follow-up"}>
            <input
              className={`input ${overdue ? "border-red-700" : ""}`}
              type="date"
              value={form.nextFollowUpDate}
              onChange={set("nextFollowUpDate")}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Next action">
            <textarea className="input min-h-[60px]" value={form.nextAction} onChange={set("nextAction")} placeholder="What needs to happen next" />
          </Field>
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={save}
            disabled={pending}
            className="btn-accent rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          {saved && <span className="text-xs text-emerald-400">Saved</span>}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Activity</h2>
        <Timeline subjectType="deal" subjectId={deal.id} timeline={timeline} />
      </div>
    </div>
  );
}
