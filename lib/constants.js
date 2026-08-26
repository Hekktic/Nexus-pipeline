export const BRAND_STATUS_OPTIONS = [
  { value: "prospect", label: "Prospect", color: "bg-slate-600" },
  { value: "discovery_call", label: "Discovery call", color: "bg-blue-600" },
  { value: "pilot", label: "Pilot", color: "bg-purple-600" },
  { value: "active", label: "Active", color: "bg-emerald-600" },
  { value: "paused", label: "Paused", color: "bg-orange-700" },
  { value: "churned", label: "Churned", color: "bg-red-800" },
];

export const VETTING_STATUS_OPTIONS = [
  { value: "not_reviewed", label: "Not reviewed", color: "bg-slate-600" },
  { value: "reviewing", label: "Reviewing", color: "bg-amber-600" },
  { value: "verified", label: "Verified", color: "bg-emerald-600" },
  { value: "rejected", label: "Rejected", color: "bg-red-800" },
];

export const ONBOARDING_STATUS_OPTIONS = [
  { value: "applied", label: "Applied", color: "bg-slate-600" },
  { value: "contacted", label: "Contacted", color: "bg-blue-600" },
  { value: "negotiating", label: "Negotiating", color: "bg-amber-600" },
  { value: "onboarded", label: "Onboarded", color: "bg-purple-600" },
  { value: "active", label: "Active", color: "bg-emerald-600" },
  { value: "inactive", label: "Inactive", color: "bg-orange-700" },
];

export const BRAND_STATUS_VALUES = BRAND_STATUS_OPTIONS.map((s) => s.value);
export const VETTING_STATUS_VALUES = VETTING_STATUS_OPTIONS.map((s) => s.value);
export const ONBOARDING_STATUS_VALUES = ONBOARDING_STATUS_OPTIONS.map((s) => s.value);

function metaFrom(options) {
  return (value) => options.find((o) => o.value === value) || options[0];
}

export const brandStatusMeta = metaFrom(BRAND_STATUS_OPTIONS);
export const vettingStatusMeta = metaFrom(VETTING_STATUS_OPTIONS);
export const onboardingStatusMeta = metaFrom(ONBOARDING_STATUS_OPTIONS);

export function timeAgo(ts) {
  const t = typeof ts === "number" ? ts : new Date(ts).getTime();
  if (Number.isNaN(t)) return "";

  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
