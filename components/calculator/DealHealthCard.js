"use client";

import { Check, X } from "lucide-react";

const HEADLINE_COLOR = {
  "Strong deal": "text-emerald-400 border-emerald-900 bg-emerald-950/30",
  "Workable but margin is tight": "text-amber-400 border-amber-900 bg-amber-950/30",
  "Brand margin is too low": "text-orange-400 border-orange-900 bg-orange-950/30",
  "Creator compensation may be unattractive": "text-orange-400 border-orange-900 bg-orange-950/30",
  "Nexus fee does not cover projected operating expenses": "text-orange-400 border-orange-900 bg-orange-950/30",
  "Campaign does not break even under current assumptions": "text-red-400 border-red-900 bg-red-950/30",
};

export default function DealHealthCard({ health }) {
  if (!health || !health.headline) return null;

  const colorClass = HEADLINE_COLOR[health.headline] || "text-slate-300 border-slate-800 bg-slate-900";

  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Deal health</p>
      <p className="mb-3 text-base font-semibold">{health.headline}</p>
      <div className="space-y-1.5">
        {health.checks.map((c) => (
          <div key={c.id} className="flex items-start gap-2 text-xs text-slate-300">
            {c.pass ? (
              <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <X size={13} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <div>
              <span>{c.label}</span>
              <span className="ml-1.5 text-slate-500">— {c.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] italic text-slate-500">
        These figures are estimates based on the assumptions entered, not a guarantee of results.
      </p>
    </div>
  );
}
