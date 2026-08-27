export const QUICK_OUTPUT_LABELS = {
  grossSales: { label: "Gross sales", format: "currency" },
  estimatedRefundedSales: { label: "Estimated refunded sales", format: "currency" },
  netAttributedSales: { label: "Net attributed sales", format: "currency" },
  creatorEarnings: { label: "Creator earnings", format: "currency" },
  nexusPercentEarnings: { label: "Nexus % earnings", format: "currency" },
  nexusFixedEarnings: { label: "Nexus fixed earnings", format: "currency" },
  totalNexusRevenue: { label: "Total Nexus revenue", format: "currency" },
  brandRevenueRemaining: { label: "Brand revenue remaining", format: "currency" },
  totalCampaignExpenses: { label: "Total campaign expenses", format: "currency" },
  estimatedCampaignProfit: { label: "Estimated campaign profit", format: "currency" },
  effectiveCommissionPercent: { label: "Effective commission %", format: "percent" },
};

export const ADVANCED_OUTPUT_LABELS = {
  grossMerchandiseValue: { label: "Gross merchandise value", format: "currency" },
  revenueAfterDiscounts: { label: "Revenue after discounts", format: "currency" },
  refundAdjustedRevenue: { label: "Refund-adjusted revenue", format: "currency" },
  totalCOGS: { label: "Total COGS", format: "currency" },
  paymentProcessingCosts: { label: "Payment processing costs", format: "currency" },
  creatorCompensation: { label: "Creator compensation", format: "currency" },
  nexusRevenue: { label: "Nexus revenue", format: "currency" },
  brandGrossProfit: { label: "Brand gross profit", format: "currency" },
  brandNetCampaignProfit: { label: "Brand net campaign profit", format: "currency" },
  brandProfitMargin: { label: "Brand profit margin", format: "percent" },
  creatorEffectiveEarningsPerSale: { label: "Creator earnings / sale", format: "currency" },
  nexusEffectiveEarningsPerSale: { label: "Nexus earnings / sale", format: "currency" },
  campaignROI: { label: "Campaign ROI", format: "percent" },
  brandReturnOnSpend: { label: "Brand return on spend", format: "percent" },
  breakEvenUnits: { label: "Break-even units", format: "number" },
  unitsForDesiredMargin: { label: "Units for desired margin", format: "number" },
};

export function outputLabelsFor(mode) {
  return mode === "advanced" ? ADVANCED_OUTPUT_LABELS : QUICK_OUTPUT_LABELS;
}

export function formatOutputValue(value, format) {
  if (value === null || value === undefined) return "—";
  if (format === "currency") return `$${Number(value).toFixed(2)}`;
  if (format === "percent") return `${Number(value).toFixed(1)}%`;
  return String(value);
}
