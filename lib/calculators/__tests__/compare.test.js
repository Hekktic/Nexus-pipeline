import { describe, expect, it } from "vitest";
import { compareScenarios } from "../compare";

describe("compareScenarios", () => {
  it("lines up matching output keys across scenarios", () => {
    const rows = compareScenarios([
      { name: "A", outputs: { grossSales: 1000, creatorEarnings: 200 } },
      { name: "B", outputs: { grossSales: 2000, creatorEarnings: 400 } },
    ]);

    const gross = rows.find((r) => r.key === "grossSales");
    expect(gross.values).toEqual([1000, 2000]);

    const creator = rows.find((r) => r.key === "creatorEarnings");
    expect(creator.values).toEqual([200, 400]);
  });

  it("fills in null for a key missing from one scenario (e.g. comparing quick vs. advanced)", () => {
    const rows = compareScenarios([
      { name: "Quick", outputs: { grossSales: 1000 } },
      { name: "Advanced", outputs: { grossMerchandiseValue: 1000 } },
    ]);

    const gross = rows.find((r) => r.key === "grossSales");
    expect(gross.values).toEqual([1000, null]);

    const gmv = rows.find((r) => r.key === "grossMerchandiseValue");
    expect(gmv.values).toEqual([null, 1000]);
  });

  it("handles a scenario with no outputs at all", () => {
    const rows = compareScenarios([{ name: "Empty", outputs: null }, { name: "A", outputs: { x: 1 } }]);
    const x = rows.find((r) => r.key === "x");
    expect(x.values).toEqual([null, 1]);
  });
});
