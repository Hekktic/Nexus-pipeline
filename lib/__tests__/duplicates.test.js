import { describe, expect, it } from "vitest";
import { findMatchingRows } from "../duplicates";

const ROWS = [
  { id: "1", name: "Acme Skincare", contact: "hello@acme.com" },
  { id: "2", name: "Beta Brand", contact: "555-1234" },
];

describe("findMatchingRows", () => {
  it("matches on name, case-insensitively", () => {
    const matches = findMatchingRows(ROWS, "acme skincare", "someone-else@x.com");
    expect(matches.map((m) => m.id)).toEqual(["1"]);
  });

  it("matches on contact, case-insensitively", () => {
    const matches = findMatchingRows(ROWS, "Not A Match", "HELLO@ACME.COM");
    expect(matches.map((m) => m.id)).toEqual(["1"]);
  });

  it("matches on either field, whichever hits", () => {
    const matches = findMatchingRows(ROWS, "Beta Brand", "hello@acme.com");
    expect(matches.map((m) => m.id).sort()).toEqual(["1", "2"]);
  });

  it("ignores leading/trailing whitespace", () => {
    const matches = findMatchingRows(ROWS, "  Acme Skincare  ", "");
    expect(matches.map((m) => m.id)).toEqual(["1"]);
  });

  it("returns nothing when there's no match", () => {
    const matches = findMatchingRows(ROWS, "Nobody Here", "nobody@nowhere.com");
    expect(matches).toEqual([]);
  });

  it("doesn't match on empty name/contact against rows with empty fields", () => {
    const rowsWithBlank = [...ROWS, { id: "3", name: "", contact: "" }];
    const matches = findMatchingRows(rowsWithBlank, "", "");
    expect(matches).toEqual([]);
  });

  it("handles an empty rows list", () => {
    expect(findMatchingRows([], "Acme Skincare", "hello@acme.com")).toEqual([]);
  });
});
