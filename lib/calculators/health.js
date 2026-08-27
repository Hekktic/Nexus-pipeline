/**
 * Every threshold here is a plain constant, not a hidden/learned score —
 * the point of "transparent rules" is that a person can read this file and
 * see exactly why a deal got the label it got.
 */
export const HEALTH_THRESHOLDS = {
  strongMarginPercent: 20,
  tightMarginPercent: 5,
  minCreatorPerSale: 5,
};

export function dealHealth({ mode, inputs, outputs }) {
  if (!outputs) return { headline: null, checks: [], marginPercent: null };

  let profit;
  let marginPercent;
  let nexusRevenue;
  let creatorPerSale;

  if (mode === "quick") {
    profit = outputs.estimatedCampaignProfit;
    const revenue = outputs.netAttributedSales;
    marginPercent = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : null;
    nexusRevenue = outputs.totalNexusRevenue;
    const estimatedSales = Number(inputs.estimatedSales) || 0;
    creatorPerSale = estimatedSales > 0 ? outputs.creatorEarnings / estimatedSales : null;
  } else {
    profit = outputs.brandNetCampaignProfit;
    marginPercent = outputs.brandProfitMargin;
    nexusRevenue = outputs.nexusRevenue;
    creatorPerSale = outputs.creatorEffectiveEarningsPerSale;
  }

  const checks = [
    {
      id: "breaks_even",
      label: "Campaign breaks even",
      pass: profit > 0,
      detail: `Estimated profit: $${profit.toFixed(2)}`,
    },
    {
      id: "brand_margin",
      label: `Brand profit margin is at least ${HEALTH_THRESHOLDS.tightMarginPercent}%`,
      pass: marginPercent !== null && marginPercent >= HEALTH_THRESHOLDS.tightMarginPercent,
      detail: marginPercent === null ? "Not enough data to calculate margin." : `Margin: ${marginPercent}%`,
    },
    {
      id: "nexus_revenue",
      label: "Nexus earns a positive fee on this deal",
      pass: nexusRevenue !== null && nexusRevenue > 0,
      detail: nexusRevenue === null ? "Not enough data." : `Nexus revenue: $${nexusRevenue.toFixed(2)}`,
    },
    {
      id: "creator_comp",
      label: `Creator earns at least $${HEALTH_THRESHOLDS.minCreatorPerSale} per sale`,
      pass: creatorPerSale === null ? true : creatorPerSale >= HEALTH_THRESHOLDS.minCreatorPerSale,
      detail: creatorPerSale === null ? "Not enough data." : `Creator earns $${creatorPerSale.toFixed(2)} per sale`,
    },
  ];

  let headline;
  if (!checks[0].pass) headline = "Campaign does not break even under current assumptions";
  else if (!checks[1].pass) headline = "Brand margin is too low";
  else if (!checks[2].pass) headline = "Nexus fee does not cover projected operating expenses";
  else if (!checks[3].pass) headline = "Creator compensation may be unattractive";
  else if (marginPercent !== null && marginPercent < HEALTH_THRESHOLDS.strongMarginPercent) {
    headline = "Workable but margin is tight";
  } else {
    headline = "Strong deal";
  }

  return { headline, checks, marginPercent };
}
