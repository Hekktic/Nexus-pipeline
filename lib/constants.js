export const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-slate-600" },
  { value: "contacted", label: "Contacted", color: "bg-blue-600" },
  { value: "negotiating", label: "Negotiating", color: "bg-amber-600" },
  { value: "pilot", label: "Pilot", color: "bg-purple-600" },
  { value: "active", label: "Active", color: "bg-emerald-600" },
  { value: "paused", label: "Paused", color: "bg-orange-700" },
  { value: "won", label: "Closed won", color: "bg-green-700" },
  { value: "lost", label: "Closed lost", color: "bg-red-800" },
];

export const STATUS_VALUES = STATUS_OPTIONS.map((s) => s.value);

export const ENTRY_TYPES = ["creator", "brand"];

export function statusMeta(value) {
  return STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];
}

/** Name to show for a joined profile row, with sensible fallbacks. */
export function displayName(profile) {
  if (!profile) return null;
  return profile.full_name || profile.email || null;
}

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
