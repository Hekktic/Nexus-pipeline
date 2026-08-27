import { describe, expect, it } from "vitest";
import { applyFraction, fromCents, safeDivide, toCents, toFraction } from "../money";

describe("money", () => {
  it("converts dollars to cents without floating-point drift", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1 + 0.2)).toBe(30); // the classic 0.30000000000000004 case
  });

  it("converts cents back to dollars", () => {
    expect(fromCents(1999)).toBe(19.99);
    expect(fromCents(100)).toBe(1);
  });

  it("turns a person-entered percent into a fraction", () => {
    expect(toFraction(15)).toBe(0.15);
    expect(toFraction(100)).toBe(1);
    expect(toFraction(0)).toBe(0);
  });

  it("applies a fraction to cents and rounds to the nearest cent", () => {
    expect(applyFraction(10000, 0.15)).toBe(1500);
    expect(applyFraction(333, 0.1)).toBe(33); // 33.3 rounds down
    expect(applyFraction(335, 0.1)).toBe(34); // 33.5 rounds up (banker's not required)
  });

  it("guards divide-by-zero and negative denominators", () => {
    expect(safeDivide(100, 0)).toBeNull();
    expect(safeDivide(100, -5)).toBeNull();
    expect(safeDivide(100, 50)).toBe(2);
  });
});
