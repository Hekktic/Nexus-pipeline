"use client";

import { formatOutputValue, outputLabelsFor } from "@/lib/calculators/labels";

export default function ResultsPanel({ mode, outputs, errors }) {
  if (errors && errors.length > 0) {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950/40 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">
          Fix these before results can be calculated
        </p>
        <ul className="list-inside list-disc space-y-0.5 text-sm text-red-300">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (!outputs) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-500">
        Fill in the required fields to see results.
      </div>
    );
  }

  const labels = outputLabelsFor(mode);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Results — estimates based on the assumptions entered above
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {Object.entries(labels).map(([key, meta]) => (
          <div key={key} className="flex items-baseline justify-between gap-3 border-b border-neutral-900 py-1">
            <span className="text-xs text-neutral-400">{meta.label}</span>
            <span className="text-sm font-medium text-white">
              {formatOutputValue(outputs[key], meta.format)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
