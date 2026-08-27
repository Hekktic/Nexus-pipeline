export function validateRequired(label, value, errors) {
  if (value === "" || value === null || value === undefined) {
    errors.push(`${label} is required.`);
    return false;
  }
  return true;
}

export function validateNonNegative(label, value, errors) {
  if (value === "" || value === null || value === undefined) return true;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    errors.push(`${label} must be a number.`);
    return false;
  }
  if (n < 0) {
    errors.push(`${label} can't be negative.`);
    return false;
  }
  return true;
}

export function validatePercent(label, value, errors) {
  if (value === "" || value === null || value === undefined) return true;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    errors.push(`${label} must be a number.`);
    return false;
  }
  if (n < 0 || n > 100) {
    errors.push(`${label} must be between 0 and 100.`);
    return false;
  }
  return true;
}

/** Percent-based deductions from the same pool of revenue can't add past 100%. */
export function validatePercentBudget(label, percents, errors) {
  const total = percents.reduce((sum, p) => sum + (Number(p) || 0), 0);
  if (total > 100) {
    errors.push(`${label} add up to ${total.toFixed(1)}%, which is more than the revenue they're taken from.`);
    return false;
  }
  return true;
}
