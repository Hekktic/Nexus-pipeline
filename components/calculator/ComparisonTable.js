"use client";

import { compareScenarios } from "@/lib/calculators/compare";
import { ADVANCED_OUTPUT_LABELS, QUICK_OUTPUT_LABELS, formatOutputValue } from "@/lib/calculators/labels";

const ALL_LABELS = { ...QUICK_OUTPUT_LABELS, ...ADVANCED_OUTPUT_LABELS };

export default function ComparisonTable({ scenarios }) {
  if (scenarios.length < 2) {
    return <p className="text-sm text-neutral-500">Select 2 or 3 scenarios above to compare them.</p>;
  }

  const rows = compareScenarios(scenarios);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-neutral-800 bg-neutral-900">
            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400">Metric</th>
            {scenarios.map((s) => (
              <th key={s.id} className="px-3 py-2 text-left text-xs font-medium text-neutral-400">
                {s.name}
                <span className="ml-1.5 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase text-neutral-500">
                  {s.mode}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const meta = ALL_LABELS[row.key] || { label: row.key, format: "number" };
            return (
              <tr key={row.key} className="border-b border-neutral-900">
                <td className="px-3 py-1.5 text-xs text-neutral-400">{meta.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="px-3 py-1.5 text-sm text-white">
                    {formatOutputValue(v, meta.format)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
