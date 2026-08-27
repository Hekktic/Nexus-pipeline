"use client";

import Field from "@/components/Field";

export const QUICK_DEFAULTS = {
  sellingPrice: "",
  estimatedSales: "",
  creatorCommissionPercent: "",
  nexusCommissionPercent: "",
  nexusFixedFee: "",
  refundPercent: "",
  campaignExpenses: "",
};

export default function QuickForm({ values, onChange }) {
  const set = (key) => (e) => onChange(key, e.target.value);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Product selling price" required>
        <input className="input" type="number" min="0" value={values.sellingPrice} onChange={set("sellingPrice")} placeholder="$" />
      </Field>
      <Field label="Estimated number of sales" required>
        <input className="input" type="number" min="0" value={values.estimatedSales} onChange={set("estimatedSales")} />
      </Field>
      <Field label="Creator commission %" required>
        <input className="input" type="number" min="0" max="100" value={values.creatorCommissionPercent} onChange={set("creatorCommissionPercent")} />
      </Field>
      <Field label="Nexus commission %" required>
        <input className="input" type="number" min="0" max="100" value={values.nexusCommissionPercent} onChange={set("nexusCommissionPercent")} />
      </Field>
      <Field label="Optional fixed Nexus fee">
        <input className="input" type="number" min="0" value={values.nexusFixedFee} onChange={set("nexusFixedFee")} placeholder="$" />
      </Field>
      <Field label="Estimated refund/return %">
        <input className="input" type="number" min="0" max="100" value={values.refundPercent} onChange={set("refundPercent")} />
      </Field>
      <Field label="Optional campaign expenses">
        <input className="input" type="number" min="0" value={values.campaignExpenses} onChange={set("campaignExpenses")} placeholder="$" />
      </Field>
    </div>
  );
}
