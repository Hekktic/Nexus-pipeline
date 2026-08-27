import { describe, expect, it } from "vitest";
import { computeAdvanced, validateAdvancedInputs } from "../advanced";

const BASE = {
  productPrice: 100,
  productCost: 30,
  unitsSold: 100,
  avgDiscountPercent: 0,
  refundPercent: 0,
  paymentProcessingPercent: 3,
  paymentProcessingFixedFee: 0.3,
  creatorCommissionPercent: 15,
  creatorFixedPayment: 0,
  nexusCommissionPercent: 10,
  nexusRetainerFee: 0,
  adSpend: 500,
  sampleCost: 0,
  shippingFulfillmentExpenses: 0,
  otherExpenses: 0,
  desiredBrandProfitMargin: "",
};

describe("computeAdvanced", () => {
  it("computes gross merchandise value and revenue after discounts/refunds", () => {
    const { ok, outputs } = computeAdvanced(BASE);
    expect(ok).toBe(true);
    expect(outputs.grossMerchandiseValue).toBe(10000); // $100 * 100 units
    expect(outputs.revenueAfterDiscounts).toBe(10000); // 0% discount
    expect(outputs.refundAdjustedRevenue).toBe(10000); // 0% refund
  });

  it("reduces revenue for discounts and refunds, in that order", () => {
    const { outputs } = computeAdvanced({ ...BASE, avgDiscountPercent: 10, refundPercent: 5 });
    expect(outputs.revenueAfterDiscounts).toBe(9000); // 10000 * 0.90
    expect(outputs.refundAdjustedRevenue).toBe(8550); // 9000 * 0.95
  });

  it("charges cost of goods sold on every unit sold", () => {
    const { outputs } = computeAdvanced(BASE);
    expect(outputs.totalCOGS).toBe(3000); // $30 * 100 units
  });

  it("charges payment processing as a percentage plus a per-unit fixed fee", () => {
    const { outputs } = computeAdvanced(BASE);
    // 3% of $10,000 = $300, plus $0.30 * 100 units = $30
    expect(outputs.paymentProcessingCosts).toBe(330);
  });

  it("computes creator and Nexus compensation as percentage plus fixed", () => {
    const { outputs } = computeAdvanced({ ...BASE, creatorFixedPayment: 200, nexusRetainerFee: 100 });
    expect(outputs.creatorCompensation).toBe(1700); // 15% of 10000 + 200
    expect(outputs.nexusRevenue).toBe(1100); // 10% of 10000 + 100
  });

  it("computes net campaign profit, margin, ROI, and return on spend", () => {
    const { outputs } = computeAdvanced(BASE);
    // brandGrossProfit = 10000 - 3000 = 7000
    // net = 7000 - 330 (processing) - 1500 (creator) - 1000 (nexus) - 500 (ad) = 3670
    expect(outputs.brandNetCampaignProfit).toBe(3670);
    expect(outputs.brandProfitMargin).toBeCloseTo(36.7, 5);
    expect(outputs.creatorEffectiveEarningsPerSale).toBe(15); // 1500 / 100 units
    expect(outputs.nexusEffectiveEarningsPerSale).toBe(10); // 1000 / 100 units
    // totalCampaignSpend = 1500 + 1000 + 330 + 500 = 3330
    expect(outputs.campaignROI).toBeCloseTo(110.2, 5);
    expect(outputs.brandReturnOnSpend).toBeCloseTo(300.3, 5);
  });

  it("computes break-even units from fixed vs. variable costs", () => {
    const { outputs } = computeAdvanced(BASE);
    // contribution margin per unit = 100 - (30 + 3 + 0.30 + 15 + 10) = 41.70
    // fixed costs = 500 (ad spend only, here)
    // 500 / 41.70 = 11.99 -> ceil 12
    expect(outputs.breakEvenUnits).toBe(12);
  });

  it("computes units needed to reach a desired brand profit margin", () => {
    const { outputs } = computeAdvanced({ ...BASE, desiredBrandProfitMargin: 40 });
    // solved by hand: 500 / (41.70 - 0.40 * 100) = 500 / 1.70 = 294.1 -> ceil 295
    expect(outputs.unitsForDesiredMargin).toBe(295);
  });

  it("returns null for break-even units when the contribution margin is negative", () => {
    // A product cost this high (not a percentage, so it doesn't trip the
    // percent-budget validation) eats the entire unit price on its own.
    const { outputs } = computeAdvanced({ ...BASE, productCost: 95 });
    expect(outputs.breakEvenUnits).toBeNull();
  });

  it("rejects percentage-based cuts that exceed 100% combined", () => {
    const errors = validateAdvancedInputs({
      ...BASE,
      creatorCommissionPercent: 50,
      nexusCommissionPercent: 40,
      paymentProcessingPercent: 20,
    });
    expect(errors.some((e) => e.includes("more than the revenue"))).toBe(true);
  });

  it("rejects a negative product cost", () => {
    const errors = validateAdvancedInputs({ ...BASE, productCost: -5 });
    expect(errors.some((e) => e.includes("negative"))).toBe(true);
  });
});
