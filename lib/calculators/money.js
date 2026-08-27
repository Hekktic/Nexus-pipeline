/**
 * All money math happens in integer cents so repeated multiplication/division
 * (commissions, fees, refunds) can't accumulate floating-point drift. Dollar
 * values only exist at the input/output boundary.
 */

export function toCents(dollars) {
  const n = Number(dollars);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromCents(cents) {
  return Math.round(cents) / 100;
}

/** Percent as entered by a person (e.g. 15 for 15%) -> a 0-1 fraction. */
export function toFraction(percent) {
  const n = Number(percent);
  return Number.isFinite(n) ? n / 100 : 0;
}

/** cents * fraction, rounded to the nearest cent at each step. */
export function applyFraction(cents, fraction) {
  return Math.round(cents * fraction);
}

/** Guards a division that could be by zero or a negative denominator. */
export function safeDivide(numerator, denominator) {
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  return numerator / denominator;
}
