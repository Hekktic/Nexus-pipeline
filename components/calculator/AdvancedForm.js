"use client";

import Field from "@/components/Field";

export const ADVANCED_DEFAULTS = {
  productPrice: "",
  productCost: "",
  unitsSold: "",
  avgDiscountPercent: "",
  refundPercent: "",
  paymentProcessingPercent: "",
  paymentProcessingFixedFee: "",
  creatorCommissionPercent: "",
  creatorFixedPayment: "",
  nexusCommissionPercent: "",
  nexusRetainerFee: "",
  adSpend: "",
  sampleCost: "",
  shippingFulfillmentExpenses: "",
  otherExpenses: "",
  desiredBrandProfitMargin: "",
};

export default function AdvancedForm({ values, onChange }) {
  const set = (key) => (e) => onChange(key, e.target.value);

  return (
    <div className="space-y-4">
      <FieldGroup title="Product">
        <Field label="Product price" required>
          <input className="input" type="number" min="0" value={values.productPrice} onChange={set("productPrice")} placeholder="$" />
        </Field>
        <Field label="Product cost (COGS) per unit" required>
          <input className="input" type="number" min="0" value={values.productCost} onChange={set("productCost")} placeholder="$" />
        </Field>
        <Field label="Estimated units sold" required>
          <input className="input" type="number" min="0" value={values.unitsSold} onChange={set("unitsSold")} />
        </Field>
        <Field label="Average discount %">
          <input className="input" type="number" min="0" max="100" value={values.avgDiscountPercent} onChange={set("avgDiscountPercent")} />
        </Field>
        <Field label="Refund/return %">
          <input className="input" type="number" min="0" max="100" value={values.refundPercent} onChange={set("refundPercent")} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Payment processing">
        <Field label="Processing %">
          <input className="input" type="number" min="0" max="100" value={values.paymentProcessingPercent} onChange={set("paymentProcessingPercent")} />
        </Field>
        <Field label="Fixed fee per transaction">
          <input className="input" type="number" min="0" value={values.paymentProcessingFixedFee} onChange={set("paymentProcessingFixedFee")} placeholder="$" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Creator">
        <Field label="Creator commission %" required>
          <input className="input" type="number" min="0" max="100" value={values.creatorCommissionPercent} onChange={set("creatorCommissionPercent")} />
        </Field>
        <Field label="Creator fixed payment">
          <input className="input" type="number" min="0" value={values.creatorFixedPayment} onChange={set("creatorFixedPayment")} placeholder="$" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Nexus">
        <Field label="Nexus commission %" required>
          <input className="input" type="number" min="0" max="100" value={values.nexusCommissionPercent} onChange={set("nexusCommissionPercent")} />
        </Field>
        <Field label="Nexus retainer / fixed fee">
          <input className="input" type="number" min="0" value={values.nexusRetainerFee} onChange={set("nexusRetainerFee")} placeholder="$" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Other campaign costs">
        <Field label="Advertising spend">
          <input className="input" type="number" min="0" value={values.adSpend} onChange={set("adSpend")} placeholder="$" />
        </Field>
        <Field label="Product sample cost">
          <input className="input" type="number" min="0" value={values.sampleCost} onChange={set("sampleCost")} placeholder="$" />
        </Field>
        <Field label="Shipping / fulfillment expenses">
          <input className="input" type="number" min="0" value={values.shippingFulfillmentExpenses} onChange={set("shippingFulfillmentExpenses")} placeholder="$" />
        </Field>
        <Field label="Other campaign expenses">
          <input className="input" type="number" min="0" value={values.otherExpenses} onChange={set("otherExpenses")} placeholder="$" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Target (optional)">
        <Field label="Desired brand profit margin %">
          <input className="input" type="number" min="0" max="100" value={values.desiredBrandProfitMargin} onChange={set("desiredBrandProfitMargin")} />
        </Field>
      </FieldGroup>
    </div>
  );
}

function FieldGroup({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
