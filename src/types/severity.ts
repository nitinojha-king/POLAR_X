/**
 * STEP 1.2 — Canonical severity & lifecycle vocabulary.
 * SEVERITY      = how bad is it?        (immutable property of the event)
 * LIFECYCLE     = where is it in the workflow? (changes over time)
 * DATA STATE    = what kind of data are we looking at?
 *
 * Visual mapping — NEVER color alone: every badge pairs a dot + a
 * word with the color, so the meaning survives grayscale and
 * color-blind readers. `icon` holds a status-dot class (no emoji).
 */

// SEVERITY — how bad is it? (immutable property of the event)
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// LIFECYCLE STATUS — where is it in the workflow? (changes over time)
export type LifecycleStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "DISMISSED";

// DATA STATE — what kind of data are we looking at?
export type DataState = "LIVE" | "SIMULATED" | "PRACTICE" | "ARCHIVED";

// Visual mapping — NEVER use color alone
export const SEVERITY_STYLES: Record<
  Severity,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  CRITICAL: { label: "Critical", icon: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-500" },
  HIGH: { label: "High", icon: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-500" },
  MEDIUM: { label: "Medium", icon: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-500" },
  LOW: { label: "Low", icon: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-500" },
};

export const LIFECYCLE_STYLES: Record<
  LifecycleStatus,
  { label: string; icon: string; bg: string; text: string }
> = {
  OPEN: { label: "Open", icon: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  ACKNOWLEDGED: { label: "Acknowledged", icon: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700" },
  IN_PROGRESS: { label: "In Progress", icon: "bg-cyan-500", bg: "bg-cyan-50", text: "text-cyan-700" },
  RESOLVED: { label: "Resolved", icon: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  DISMISSED: { label: "Dismissed", icon: "bg-slate-300", bg: "bg-slate-100", text: "text-slate-600" },
};

export const DATA_STATE_STYLES: Record<
  DataState,
  { label: string; icon: string; bg: string; text: string }
> = {
  LIVE: { label: "Live", icon: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  SIMULATED: { label: "Simulated", icon: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  PRACTICE: { label: "Practice scenario", icon: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  ARCHIVED: { label: "Archived", icon: "bg-slate-300", bg: "bg-slate-100", text: "text-slate-600" },
};
