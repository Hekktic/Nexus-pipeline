import { describe, expect, it } from "vitest";
import { toCSV } from "../csv";

describe("toCSV", () => {
  it("returns an empty string for no rows", () => {
    expect(toCSV([])).toBe("");
    expect(toCSV(null)).toBe("");
  });

  it("writes a header row from the first row's keys", () => {
    const csv = toCSV([{ name: "Acme", contact: "hello@acme.com" }]);
    expect(csv).toBe("name,contact\nAcme,hello@acme.com");
  });

  it("writes multiple rows in order", () => {
    const csv = toCSV([
      { name: "Acme", contact: "a@x.com" },
      { name: "Beta", contact: "b@x.com" },
    ]);
    expect(csv).toBe("name,contact\nAcme,a@x.com\nBeta,b@x.com");
  });

  it("quotes a value containing a comma", () => {
    const csv = toCSV([{ name: "Acme, Inc.", contact: "a@x.com" }]);
    expect(csv).toBe('name,contact\n"Acme, Inc.",a@x.com');
  });

  it("quotes a value containing a newline", () => {
    const csv = toCSV([{ notes: "line one\nline two" }]);
    expect(csv).toBe('notes\n"line one\nline two"');
  });

  it("escapes an internal double quote by doubling it", () => {
    const csv = toCSV([{ name: 'The "Best" Brand' }]);
    expect(csv).toBe('name\n"The ""Best"" Brand"');
  });

  it("renders null/undefined as an empty cell", () => {
    const csv = toCSV([{ name: "Acme", notes: null, category: undefined }]);
    expect(csv).toBe("name,notes,category\nAcme,,");
  });
});
