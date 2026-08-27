/**
 * Shapes several scenarios' outputs into rows for a side-by-side table.
 * Scenarios can be a mix of quick/advanced — a key missing from one
 * scenario's outputs just renders as null in that column.
 */
export function compareScenarios(scenarios) {
  const keys = new Set();
  scenarios.forEach((s) => Object.keys(s.outputs || {}).forEach((k) => keys.add(k)));

  return Array.from(keys).map((key) => ({
    key,
    values: scenarios.map((s) => (s.outputs ? s.outputs[key] ?? null : null)),
  }));
}
