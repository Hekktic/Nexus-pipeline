import { applyFraction, fromCents, safeDivide, toCents, toFraction } from "./money";
import { validateNonNegative, validatePercent, validatePercentBudget, validateRequired } from "./validate";

export const ADVANCED_FIELDS = [
  "productPrice",
  "productCost",
  "unitsSold",
  "avgDiscountPercent",
  "refundPercent",
  "paymentProcessingPercent",
  "paymentProcessingFixedFee",
  "creatorCommissionPercent",
  "creatorFixedPayment",
  "nexusCommissionPercent",
  "nexusRetainerFee",
  "adSpend",
  "sampleCost",
  "shippingFulfillmentExpenses",
  "otherExpenses",
  "desiredBrandProfitMargin",
];

export function validateAdvancedInputs(input) {
  const errors = [];

  validateRequired("Product price", input.productPrice, errors);
  validateNonNegative("Product price", input.productPrice, errors);
  validateRequired("Product cost", input.productCost, errors);
  validateNonNegative("Product cost", input.productCost, errors);
  validateRequired("Units sold", input.unitsSold, errors);
  validateNonNegative("Units sold", input.unitsSold, errors);
  validatePercent("Average discount", input.avgDiscountPercent, errors);
  validatePercent("Refund/return percentage", input.refundPercent, errors);
  validatePercent("Payment processing percentage", input.paymentProcessingPercent, errors);
  validateNonNegative("Payment processing fixed fee", input.paymentProcessingFixedFee, errors);
  validateRequired("Creator commission", input.creatorCommissionPercent, errors);
  validatePercent("Creator commission", input.creatorCommissionPercent, errors);
  validateNonNegative("Creator fixed payment", input.creatorFixedPayment, errors);
  validateRequired("Nexus commission", input.nexusCommissionPercent, errors);
  validatePercent("Nexus commission", input.nexusCommissionPercent, errors);
  validateNonNegative("Nexus retainer/fixed fee", input.nexusRetainerFee, errors);
  validateNonNegative("Advertising spend", input.adSpend, errors);
  validateNonNegative("Sample cost", input.sampleCost, errors);
  validateNonNegative("Shipping/fulfillment expenses", input.shippingFulfillmentExpenses, errors);
  validateNonNegative("Other expenses", input.otherExpenses, errors);
  validatePercent("Desired brand profit margin", input.desiredBrandProfitMargin, errors);

  validatePercentBudget(
    "Creator commission, Nexus commission, and payment processing",
    [input.creatorCommissionPercent, input.nexusCommissionPercent, input.paymentProcessingPercent],
    errors
  );

  return errors;
}

/**
 * Fuller cost model: per-unit price/cost/fees plus campaign-level fixed
 * costs, so it can also answer break-even and target-margin questions that
 * the quick model can't (those need a fixed-vs-variable cost split).
 *
 * Assumptions worth stating plainly: COGS is charged on every unit sold
 * (not netted down for refunds — the product still had to be made), and the
 * per-transaction payment processing fee is charged once per unit sold
 * (one order per unit, not accounting for multi-item orders).
 */
export function computeAdvanced(input) {
  const errors = validateAdvancedInputs(input);
  if (errors.length > 0) return { ok: false, errors, outputs: null };

  const productPriceCents = toCents(input.productPrice);
  const productCostCents = toCents(input.productCost);
  const unitsSold = Number(input.unitsSold) || 0;
  const discountFraction = toFraction(input.avgDiscountPercent || 0);
  const refundFraction = toFraction(input.refundPercent || 0);
  const processingFraction = toFraction(input.paymentProcessingPercent || 0);
  const processingFixedFeeCents = toCents(input.paymentProcessingFixedFee || 0);
  const creatorFraction = toFraction(input.creatorCommissionPercent);
  const creatorFixedPaymentCents = toCents(input.creatorFixedPayment || 0);
  const nexusFraction = toFraction(input.nexusCommissionPercent);
  const nexusRetainerFeeCents = toCents(input.nexusRetainerFee || 0);
  const adSpendCents = toCents(input.adSpend || 0);
  const sampleCostCents = toCents(input.sampleCost || 0);
  const shippingCents = toCents(input.shippingFulfillmentExpenses || 0);
  const otherExpensesCents = toCents(input.otherExpenses || 0);

  // ---- Aggregate campaign totals ----
  const grossMerchandiseValueCents = Math.round(productPriceCents * unitsSold);
  const revenueAfterDiscountsCents = applyFraction(grossMerchandiseValueCents, 1 - discountFraction);
  const refundAdjustedRevenueCents = applyFraction(revenueAfterDiscountsCents, 1 - refundFraction);

  const totalCOGSCents = Math.round(productCostCents * unitsSold);

  const paymentProcessingPercentCostCents = applyFraction(refundAdjustedRevenueCents, processingFraction);
  const paymentProcessingFixedCostsCents = Math.round(processingFixedFeeCents * unitsSold);
  const paymentProcessingCostsCents = paymentProcessingPercentCostCents + paymentProcessingFixedCostsCents;

  const creatorCompensationCents =
    applyFraction(refundAdjustedRevenueCents, creatorFraction) + creatorFixedPaymentCents;
  const nexusRevenueCents = applyFraction(refundAdjustedRevenueCents, nexusFraction) + nexusRetainerFeeCents;

  const brandGrossProfitCents = refundAdjustedRevenueCents - totalCOGSCents;

  const campaignFixedAndVariableExpensesCents = adSpendCents + sampleCostCents + shippingCents + otherExpensesCents;

  const brandNetCampaignProfitCents =
    brandGrossProfitCents -
    paymentProcessingCostsCents -
    creatorCompensationCents -
    nexusRevenueCents -
    campaignFixedAndVariableExpensesCents;

  const brandProfitMarginFraction = safeDivide(brandNetCampaignProfitCents, refundAdjustedRevenueCents);

  const creatorEffectiveEarningsPerSaleCents = unitsSold > 0 ? creatorCompensationCents / unitsSold : null;
  const nexusEffectiveEarningsPerSaleCents = unitsSold > 0 ? nexusRevenueCents / unitsSold : null;

  const totalCampaignSpendCents =
    creatorCompensationCents + nexusRevenueCents + paymentProcessingCostsCents + campaignFixedAndVariableExpensesCents;

  const campaignROIFraction = safeDivide(brandNetCampaignProfitCents, totalCampaignSpendCents);
  const brandReturnOnSpendFraction = safeDivide(refundAdjustedRevenueCents, totalCampaignSpendCents);

  // ---- Per-unit marginal analysis, for break-even / target-margin ----
  const unitNetPriceCents = Math.round(productPriceCents * (1 - discountFraction) * (1 - refundFraction));
  const unitVariableCostsCents =
    productCostCents +
    applyFraction(unitNetPriceCents, processingFraction) +
    processingFixedFeeCents +
    applyFraction(unitNetPriceCents, creatorFraction) +
    applyFraction(unitNetPriceCents, nexusFraction);
  const contributionMarginPerUnitCents = unitNetPriceCents - unitVariableCostsCents;

  const fixedCostsCents =
    creatorFixedPaymentCents + nexusRetainerFeeCents + adSpendCents + sampleCostCents + shippingCents + otherExpensesCents;

  const breakEvenUnits =
    contributionMarginPerUnitCents > 0 ? fixedCostsCents / contributionMarginPerUnitCents : null;

  let unitsForDesiredMargin = null;
  if (input.desiredBrandProfitMargin !== "" && input.desiredBrandProfitMargin !== null && input.desiredBrandProfitMargin !== undefined) {
    const desiredFraction = toFraction(input.desiredBrandProfitMargin);
    const denominator = contributionMarginPerUnitCents - desiredFraction * unitNetPriceCents;
    unitsForDesiredMargin = denominator > 0 ? fixedCostsCents / denominator : null;
  }

  return {
    ok: true,
    errors: [],
    outputs: {
      grossMerchandiseValue: fromCents(grossMerchandiseValueCents),
      revenueAfterDiscounts: fromCents(revenueAfterDiscountsCents),
      refundAdjustedRevenue: fromCents(refundAdjustedRevenueCents),
      totalCOGS: fromCents(totalCOGSCents),
      paymentProcessingCosts: fromCents(paymentProcessingCostsCents),
      creatorCompensation: fromCents(creatorCompensationCents),
      nexusRevenue: fromCents(nexusRevenueCents),
      brandGrossProfit: fromCents(brandGrossProfitCents),
      brandNetCampaignProfit: fromCents(brandNetCampaignProfitCents),
      brandProfitMargin: brandProfitMarginFraction === null ? null : Math.round(brandProfitMarginFraction * 1000) / 10,
      creatorEffectiveEarningsPerSale:
        creatorEffectiveEarningsPerSaleCents === null ? null : fromCents(creatorEffectiveEarningsPerSaleCents),
      nexusEffectiveEarningsPerSale:
        nexusEffectiveEarningsPerSaleCents === null ? null : fromCents(nexusEffectiveEarningsPerSaleCents),
      campaignROI: campaignROIFraction === null ? null : Math.round(campaignROIFraction * 1000) / 10,
      brandReturnOnSpend: brandReturnOnSpendFraction === null ? null : Math.round(brandReturnOnSpendFraction * 1000) / 10,
      breakEvenUnits: breakEvenUnits === null ? null : Math.ceil(breakEvenUnits),
      unitsForDesiredMargin: unitsForDesiredMargin === null ? null : Math.ceil(unitsForDesiredMargin),
    },
  };
}
