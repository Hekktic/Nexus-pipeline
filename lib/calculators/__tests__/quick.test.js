import { describe, expect, it } from "vitest";
import { computeQuick, validateQuickInputs } from "../quick";

const BASE = {
  sellingPrice: 100,
  estimatedSales: 10,
  creatorCommissionPercent: 20,
  nexusCommissionPercent: 10,
  nexusFixedFee: 0,
  refundPercent: 0,
  campaignExpenses: 0,
};

describe("computeQuick", () => {
  it("computes gross sales, commissions, and profit with no refunds or expenses", () => {
    const { ok, outputs } = computeQuick(BASE);
    expect(ok).toBe(true);
    expect(outputs.grossSales).toBe(1000);
    expect(outputs.creatorEarnings).toBe(200); // 20% of 1000
    expect(outputs.nexusPercentEarnings).toBe(100); // 10% of 1000
    expect(outputs.totalNexusRevenue).toBe(100);
    expect(outputs.brandRevenueRemaining).toBe(700); // 1000 - 200 - 100
    expect(outputs.estimatedCampaignProfit).toBe(700);
    expect(outputs.effectiveCommissionPercent).toBe(30); // (200+100)/1000
  });

  it("applies the refund percentage before commissions", () => {
    const { outputs } = computeQuick({ ...BASE, refundPercent: 10 });
    expect(outputs.estimatedRefundedSales).toBe(100); // 10% of 1000
    expect(outputs.netAttributedSales).toBe(900);
    expect(outputs.creatorEarnings).toBe(180); // 20% of 900, not 1000
    expect(outputs.totalNexusRevenue).toBe(90);
  });

  it("adds a fixed Nexus fee on top of the percentage-based earnings", () => {
    const { outputs } = computeQuick({ ...BASE, nexusFixedFee: 250 });
    expect(outputs.nexusFixedEarnings).toBe(250);
    expect(outputs.totalNexusRevenue).toBe(350); // 100 percent-based + 250 fixed
  });

  it("subtracts campaign expenses to get estimated profit", () => {
    const { outputs } = computeQuick({ ...BASE, campaignExpenses: 300 });
    expect(outputs.totalCampaignExpenses).toBe(300);
    expect(outputs.estimatedCampaignProfit).toBe(400); // 700 - 300
  });

  it("rejects commission percentages that add up to more than 100%", () => {
    const errors = validateQuickInputs({ ...BASE, creatorCommissionPercent: 60, nexusCommissionPercent: 50 });
    expect(errors.some((e) => e.includes("more than the revenue"))).toBe(true);
  });

  it("rejects a negative selling price", () => {
    const errors = validateQuickInputs({ ...BASE, sellingPrice: -10 });
    expect(errors.some((e) => e.includes("negative"))).toBe(true);
  });

  it("requires the selling price and sales estimate", () => {
    const errors = validateQuickInputs({ ...BASE, sellingPrice: "" });
    expect(errors.some((e) => e.includes("required"))).toBe(true);
  });
});
