"use client";

/**
 * STEP 6.1 — the ONLY badge components for severity and lifecycle status.
 * Icon + word + color, never color alone (grayscale-safe).
 * Replace all ad-hoc labels ("Urgent", "Watching", "Caution", raw
 * severity words) with these.
 */
import {
  type Severity,
  type LifecycleStatus,
  type DataState,
  SEVERITY_STYLES,
  LIFECYCLE_STYLES,
  DATA_STATE_STYLES,
} from "@/types/severity";
import { cn } from "@/lib/utils";

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const style = SEVERITY_STYLES[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        style.bg,
        style.text,
        className
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.icon)} />
      {style.label}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: LifecycleStatus; className?: string }) {
  const style = LIFECYCLE_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.icon)} />
      {style.label}
    </span>
  );
}

export function DataStateBadge({ dataState, className }: { dataState: DataState; className?: string }) {
  const style = DATA_STATE_STYLES[dataState];
  return (
    <span
      title={dataState === "PRACTICE" ? "Training content — NOT an active incident" : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.icon)} />
      {style.label}
    </span>
  );
}
