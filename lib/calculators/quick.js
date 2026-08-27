import { applyFraction, fromCents, safeDivide, toCents, toFraction } from "./money";
import { validateNonNegative, validatePercent, validatePercentBudget, validateRequired } from "./validate";

export const QUICK_FIELDS = [
  "sellingPrice",
  "estimatedSales",
  "creatorCommissionPercent",
  "nexusCommissionPercent",
  "nexusFixedFee",
  "refundPercent",
  "campaignExpenses",
];

export function validateQuickInputs(input) {
  const errors = [];

  validateRequired("Selling price", input.sellingPrice, errors);
  validateNonNegative("Selling price", input.sellingPrice, errors);
  validateRequired("Estimated number of sales", input.estimatedSales, errors);
  validateNonNegative("Estimated number of sales", input.estimatedSales, errors);
  validateRequired("Creator commission", input.creatorCommissionPercent, errors);
  validatePercent("Creator commission", input.creatorCommissionPercent, errors);
  validateRequired("Nexus commission", input.nexusCommissionPercent, errors);
  validatePercent("Nexus commission", input.nexusCommissionPercent, errors);
  validateNonNegative("Nexus fixed fee", input.nexusFixedFee, errors);
  validatePercent("Refund/return percentage", input.refundPercent, errors);
  validateNonNegative("Campaign expenses", input.campaignExpenses, errors);

  validatePercentBudget(
    "Creator commission and Nexus commission",
    [input.creatorCommissionPercent, input.nexusCommissionPercent],
    errors
  );

  return errors;
}

/**
 * Quick deal model: one flat selling price, a rough sales estimate, and
 * percentage-based commissions. See advanced.js for a fuller cost model.
 */
export function computeQuick(input) {
  const errors = validateQuickInputs(input);
  if (errors.length > 0) return { ok: false, errors, outputs: null };

  const sellingPriceCents = toCents(input.sellingPrice);
  const estimatedSales = Number(input.estimatedSales) || 0;
  const refundFraction = toFraction(input.refundPercent || 0);
  const creatorFraction = toFraction(input.creatorCommissionPercent);
  const nexusFraction = toFraction(input.nexusCommissionPercent);
  const nexusFixedFeeCents = toCents(input.nexusFixedFee || 0);
  const campaignExpensesCents = toCents(input.campaignExpenses || 0);

  const grossSalesCents = Math.round(sellingPriceCents * estimatedSales);
  const estimatedRefundedSalesCents = applyFraction(grossSalesCents, refundFraction);
  const netAttributedSalesCents = grossSalesCents - estimatedRefundedSalesCents;

  const creatorEarningsCents = applyFraction(netAttributedSalesCents, creatorFraction);
  const nexusPercentEarningsCents = applyFraction(netAttributedSalesCents, nexusFraction);
  const nexusFixedEarningsCents = nexusFixedFeeCents;
  const totalNexusRevenueCents = nexusPercentEarningsCents + nexusFixedEarningsCents;

  const brandRevenueRemainingCents = netAttributedSalesCents - creatorEarningsCents - totalNexusRevenueCents;
  const estimatedCampaignProfitCents = brandRevenueRemainingCents - campaignExpensesCents;

  const effectiveCommissionFraction = safeDivide(
    creatorEarningsCents + totalNexusRevenueCents,
    netAttributedSalesCents
  );

  return {
    ok: true,
    errors: [],
    outputs: {
      grossSales: fromCents(grossSalesCents),
      estimatedRefundedSales: fromCents(estimatedRefundedSalesCents),
      netAttributedSales: fromCents(netAttributedSalesCents),
      creatorEarnings: fromCents(creatorEarningsCents),
      nexusPercentEarnings: fromCents(nexusPercentEarningsCents),
      nexusFixedEarnings: fromCents(nexusFixedEarningsCents),
      totalNexusRevenue: fromCents(totalNexusRevenueCents),
      brandRevenueRemaining: fromCents(brandRevenueRemainingCents),
      totalCampaignExpenses: fromCents(campaignExpensesCents),
      estimatedCampaignProfit: fromCents(estimatedCampaignProfitCents),
      effectiveCommissionPercent:
        effectiveCommissionFraction === null ? null : Math.round(effectiveCommissionFraction * 1000) / 10,
    },
  };
}
