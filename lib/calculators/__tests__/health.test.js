import { describe, expect, it } from "vitest";
import { computeQuick } from "../quick";
import { dealHealth } from "../health";

const BASE = {
  sellingPrice: 100,
  estimatedSales: 10,
  nexusFixedFee: 0,
  refundPercent: 0,
  campaignExpenses: 0,
};

function healthFor(overrides) {
  const inputs = { ...BASE, ...overrides };
  const { outputs } = computeQuick(inputs);
  return dealHealth({ mode: "quick", inputs, outputs });
}

describe("dealHealth", () => {
  it("labels a high-margin deal as strong", () => {
    const { headline } = healthFor({ creatorCommissionPercent: 20, nexusCommissionPercent: 10 });
    expect(headline).toBe("Strong deal");
  });

  it("labels a positive but thin margin as workable but tight", () => {
    // creator 45% + nexus 40% of $1000 leaves a $150 profit -> 15% margin
    const { headline, marginPercent } = healthFor({ creatorCommissionPercent: 45, nexusCommissionPercent: 40 });
    expect(marginPercent).toBe(15);
    expect(headline).toBe("Workable but margin is tight");
  });

  it("labels a very thin margin as too low for the brand", () => {
    // creator 48% + nexus 48% leaves a $40 profit -> 4% margin
    const { headline } = healthFor({ creatorCommissionPercent: 48, nexusCommissionPercent: 48 });
    expect(headline).toBe("Brand margin is too low");
  });

  it("flags a campaign that doesn't break even", () => {
    const { headline } = healthFor({
      creatorCommissionPercent: 20,
      nexusCommissionPercent: 10,
      campaignExpenses: 800, // brand only nets $700 before expenses
    });
    expect(headline).toBe("Campaign does not break even under current assumptions");
  });

  it("flags a Nexus commission of 0% even when the brand still profits", () => {
    const { headline } = healthFor({ creatorCommissionPercent: 20, nexusCommissionPercent: 0 });
    expect(headline).toBe("Nexus fee does not cover projected operating expenses");
  });

  it("flags creator compensation that's too low per sale", () => {
    const { headline } = healthFor({ creatorCommissionPercent: 1, nexusCommissionPercent: 10 });
    expect(headline).toBe("Creator compensation may be unattractive");
  });
});
