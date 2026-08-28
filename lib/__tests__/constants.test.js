import { describe, expect, it } from "vitest";
import { isOverdue } from "../constants";

describe("isOverdue", () => {
  it("returns false for no date", () => {
    expect(isOverdue(null)).toBe(false);
    expect(isOverdue("")).toBe(false);
  });

  it("returns true for a date in the past", () => {
    expect(isOverdue("2020-01-01")).toBe(true);
  });

  it("returns false for a date in the future", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isOverdue(future.toISOString().slice(0, 10))).toBe(false);
  });

  it("returns false for today (not yet overdue)", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isOverdue(today)).toBe(false);
  });
});
