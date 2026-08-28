"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { dealStageMeta } from "@/lib/constants";

export default function RelatedDealsSection({ deals = [] }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Deals</h2>
        <Link href="/pipeline" className="link-accent flex items-center gap-1 text-xs">
          <Plus size={12} /> New deal
        </Link>
      </div>
      {deals.length === 0 ? (
        <p className="text-xs text-neutral-600">No deals yet.</p>
      ) : (
        <div className="space-y-1.5">
          {deals.map((d) => {
            const meta = dealStageMeta(d.stage);
            return (
              <Link
                key={d.id}
                href={`/deals/${d.id}`}
                className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-sm hover:border-neutral-700"
              >
                <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase text-white ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-neutral-300">
                  {d.deal_value ? `$${Number(d.deal_value).toLocaleString()}` : "no value set"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
