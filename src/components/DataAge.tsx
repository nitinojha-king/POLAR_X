"use client";

/**
 * P2-2 — the single component for every timestamp.
 * Green = fresh (< 1 h) · amber = warning (1–4 h) · red = stale (> 4 h).
 * Accepts an ISO timestamp or a pre-computed age in minutes, plus the
 * data source so provenance always travels with the age.
 */
import { Clock } from "lucide-react";
import { getNow } from "@/lib/clock";
import { cn } from "@/lib/utils";

interface DataAgeProps {
  timestamp?: string | number | Date;
  /** alternative to timestamp — age already computed */
  minutes?: number;
  source?: string;
  /** unknown uncertainty is honest: shown verbatim when provided */
  uncertainty?: string;
  className?: string;
}

export function formatAge(minutes: number): { label: string; color: string; severity: "fresh" | "warning" | "stale" } {
  if (minutes < 1) return { label: "just now", color: "bg-emerald-100 text-emerald-700", severity: "fresh" };
  if (minutes < 60) return { label: `${Math.round(minutes)}m ago`, color: "bg-emerald-100 text-emerald-700", severity: "fresh" };
  if (minutes < 240) return { label: `${Math.round(minutes / 60)}h ago`, color: "bg-amber-100 text-amber-700", severity: "warning" };
  return { label: `${Math.round(minutes / 60)}h ago`, color: "bg-rose-100 text-rose-700", severity: "stale" };
}

export function ageInMinutes(timestamp: string | number | Date): number {
  /* STEP 1.1 — ages are measured against the scenario clock so the demo
     is deterministic (server and client agree) */
  return (getNow().getTime() - new Date(timestamp).getTime()) / 60000;
}

/** Parse relative demo stamps like "31 min ago" · "4.6 h ago" · "2 min ago". */
export function parseRelativeAge(text: string): number | null {
  const min = text.match(/([\d.]+)\s*min/i);
  if (min) return parseFloat(min[1]);
  const hr = text.match(/([\d.]+)\s*h(?:ours?)?\s*ago/i);
  if (hr) return parseFloat(hr[1]) * 60;
  const day = text.match(/([\d.]+)\s*day/i);
  if (day) return parseFloat(day[1]) * 1440;
  return null;
}

export function DataAge({ timestamp, minutes, source, uncertainty, className }: DataAgeProps) {
  const ageMinutes =
    minutes ??
    (timestamp !== undefined
      ? ageInMinutes(timestamp)
      : NaN);

  if (Number.isNaN(ageMinutes)) return null;
  const { label, color, severity } = formatAge(ageMinutes);

  return (
    <span
      data-age-severity={severity}
      title={uncertainty ? `Uncertainty: ${uncertainty}` : undefined}
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold", color, className)}
    >
      <Clock className="h-3 w-3" aria-hidden />
      {label}
      {source && <span className="opacity-60">· {source}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* P2-2 — "Sort by: Most urgent | Most stale" toggle for list pages    */
/* ------------------------------------------------------------------ */

export type SortMode = "urgent" | "stale";

export function SortToggle({
  mode,
  onChange,
  className,
}: {
  mode: SortMode;
  onChange: (m: SortMode) => void;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[12.5px] font-semibold text-slate-600", className)}>
      <span className="text-slate-500">Sort by:</span>
      <span className="inline-flex overflow-hidden rounded border border-slate-300">
        {(
          [
            { k: "urgent" as SortMode, label: "Most urgent", icon: SirenIcon },
            { k: "stale" as SortMode, label: "Most stale", icon: Clock },
          ]
        ).map((o) => (
          <button
            key={o.k}
            type="button"
            aria-pressed={mode === o.k}
            onClick={() => onChange(o.k)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 text-[12.5px] font-bold transition-colors",
              mode === o.k ? "bg-sky-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <o.icon className="h-3.5 w-3.5" aria-hidden />
            {o.label}
          </button>
        ))}
      </span>
    </span>
  );
}

function SirenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7 18v-6a5 5 0 1 1 10 0v6" />
      <path d="M5 21a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1z" />
      <path d="M19 21a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1z" />
      <path d="M12 2v2" />
    </svg>
  );
}
