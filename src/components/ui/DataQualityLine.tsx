"use client";

/**
 * STEP 12.1 — DataQualityLine: provenance travels with the value.
 * Mounted under every critical value (oxygen stock, cargo weight,
 * readiness score, …) so the reader always knows where a number came
 * from, how old it is, how confident it is, and whether it is simulated.
 */
import { formatRelativeTime } from "@/lib/clock";
import { cn } from "@/lib/utils";

export interface DataProvenance {
  source: string;
  /** ISO timestamp of capture */
  capturedAt: string;
  /** e.g. "±2% count error" or "demo score" */
  confidence?: string;
  isSimulated: boolean;
}

export function DataQualityLine({ value, className }: { value: DataProvenance; className?: string }) {
  return (
    <div className={cn("mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500", className)}>
      <span>Source: {value.source}</span>
      <span aria-hidden>·</span>
      <span>Captured: {formatRelativeTime(value.capturedAt)}</span>
      {value.confidence && (
        <>
          <span aria-hidden>·</span>
          <span>Confidence: {value.confidence}</span>
        </>
      )}
      <span aria-hidden>·</span>
      <span className={cn("inline-flex items-center gap-1.5 font-semibold", value.isSimulated ? "text-amber-700" : "text-emerald-700")}>
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", value.isSimulated ? "bg-amber-500" : "bg-emerald-500")} />
        {value.isSimulated ? "Simulated" : "Live"}
      </span>
    </div>
  );
}
