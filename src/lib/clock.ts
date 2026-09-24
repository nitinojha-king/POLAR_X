/**
 * STEP 1.1 — The single source of truth for "now" in the demo.
 * Every relative/absolute timestamp in the app MUST come from here,
 * so two screens can never disagree about what time it is.
 *
 * The scenario runs at a FIXED demo instant (17 Sep 2026, 14:32 IST —
 * the moment the whiteout beacon fires). A fixed instant keeps the
 * server-rendered and client-rendered strings identical (no hydration
 * mismatches) and makes every relative age stable for a judged demo.
 * setScenarioNow() remains available to move the scenario clock.
 */

const DEFAULT_SCENARIO_NOW = "2026-09-17T14:32:00.000+05:30";

let SCENARIO_NOW: Date | null = new Date(DEFAULT_SCENARIO_NOW);

export function setScenarioNow(iso: string) {
  SCENARIO_NOW = new Date(iso);
}

export function getNow(): Date {
  return SCENARIO_NOW ?? new Date();
}

export function isSimulationActive(): boolean {
  return SCENARIO_NOW !== null;
}

/* Format helpers — use these everywhere ------------------------------ */

export function formatAbsoluteTime(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST"
  );
}

export function formatRelativeTime(iso: string): string {
  const diffMs = getNow().getTime() - new Date(iso).getTime();
  /* future timestamps read "in …" (a planned arrival is not "ago") */
  if (diffMs < 0) {
    const mins = Math.floor(-diffMs / 60000);
    if (mins < 1) return "in less than a minute";
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return `in ${hours}h ${remMins}m`;
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return `${hours}h ${remMins}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

export function formatDualTime(iso: string): string {
  return `${formatRelativeTime(iso)} · ${formatAbsoluteTime(iso)}`;
}

/* Same-day comparison (cargo timeline TODAY highlight) ---------------- */

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function isToday(iso?: string): boolean {
  if (!iso) return false;
  return isSameDay(new Date(iso), getNow());
}

/** ISO stamp for "now minus N minutes", anchored to the scenario clock. */
export function scenarioIsoMinusMinutes(minutes: number): string {
  return new Date(getNow().getTime() - minutes * 60000).toISOString();
}
