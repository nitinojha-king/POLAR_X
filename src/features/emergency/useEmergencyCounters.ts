"use client";

/**
 * STEP 3.1 — single source of truth for emergency counters.
 * The SAME hook feeds the top banner AND the incident sections, so the
 * wording and the numbers can never contradict each other.
 *
 * Canonical buckets (STEP 1.2 vocabulary):
 *   openIncidents      — LIVE/SIMULATED incidents with severity CRITICAL|HIGH
 *                        that are actively requiring response
 *   criticalIncidents  — the CRITICAL slice of those
 *   watchItems         — active MEDIUM|HIGH items (elevated risk, monitoring)
 *   practiceScenarios  — active PRACTICE items (training content, NOT incidents)
 *   resolvedToday      — anything resolved today
 */
import { useMemo } from "react";
import { lifecycleOf, dataStateOf, type Incident } from "@/lib/polar-data";
import { isToday } from "@/lib/clock";

export interface EmergencyCounters {
  openIncidents: number;
  criticalIncidents: number;
  watchItems: number;
  practiceScenarios: number;
  resolvedToday: number;
}

/** Pure counter — exported for reconciliation tests (no React needed). */
export function computeEmergencyCounters(incidents: Incident[]): EmergencyCounters {
  const active = incidents.filter((i) => {
    const lc = lifecycleOf(i);
    return lc !== "RESOLVED" && lc !== "DISMISSED";
  });
  const live = active.filter((i) => {
    const ds = dataStateOf(i);
    return ds === "LIVE" || ds === "SIMULATED";
  });
  const practice = active.filter((i) => dataStateOf(i) === "PRACTICE");
  const watchItems = active.filter((i) => i.severity === "MEDIUM" || i.severity === "HIGH");

  return {
    // These are the ONLY numbers shown to users
    openIncidents: live.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length,
    criticalIncidents: live.filter((i) => i.severity === "CRITICAL").length,
    watchItems: watchItems.length,
    practiceScenarios: practice.length,
    resolvedToday: incidents.filter((i) => lifecycleOf(i) === "RESOLVED" && isToday(i.resolvedAt)).length,
  };
}

export function useEmergencyCounters(incidents: Incident[]): EmergencyCounters {
  return useMemo(() => computeEmergencyCounters(incidents), [incidents]);
}

/** Canonical labels — reused by every surface that shows the counters. */
export const COUNTER_LABELS = {
  openIncidents: "Live incidents",
  watchItems: "Watch items",
  criticalIncidents: "Critical incidents",
  resolvedToday: "Resolved today",
  practiceScenarios: "Practice scenarios",
} as const;
