/**
 * STEP 1.3 — The ONE supply-depletion forecast function.
 * Every summary card, chart, tooltip and recommendation MUST call
 * calculateForecast() (directly or via the shared OXYGEN_FORECAST /
 * supplyForecast exports in polar-data). No duplicate math anywhere —
 * if two screens show different numbers, this file is the arbiter.
 */
import { getNow } from "./clock";

export interface ForecastInput {
  currentStock: number;
  burnRatePerDay: number;
  alertThreshold: number;
  timestamp: string;
}

export interface ForecastResult {
  daysUntilAlert: number;
  daysUntilZero: number;
  alertDate: string;
  zeroDate: string;
  status: "OK" | "WARNING" | "CRITICAL";
  formula: string;
}

export function calculateForecast(input: ForecastInput): ForecastResult {
  const { currentStock, burnRatePerDay, alertThreshold } = input;

  const daysUntilZero = burnRatePerDay > 0 ? currentStock / burnRatePerDay : Infinity;
  const unitsToAlert = Math.max(currentStock - alertThreshold, 0);
  const daysUntilAlert = burnRatePerDay > 0 ? unitsToAlert / burnRatePerDay : Infinity;

  const now = getNow();
  const finite = Number.isFinite(daysUntilZero) && Number.isFinite(daysUntilAlert);
  const alertDate = finite ? new Date(now.getTime() + daysUntilAlert * 86400000).toISOString() : "";
  const zeroDate = finite ? new Date(now.getTime() + daysUntilZero * 86400000).toISOString() : "";

  let status: "OK" | "WARNING" | "CRITICAL" = "OK";
  if (daysUntilZero <= 3) status = "CRITICAL";
  else if (daysUntilAlert <= 7) status = "WARNING";

  const round1 = (n: number) => Math.floor(n * 10) / 10;
  return {
    daysUntilAlert: round1(daysUntilAlert),
    daysUntilZero: round1(daysUntilZero),
    alertDate: finite ? alertDate : "",
    zeroDate: finite ? zeroDate : "",
    status,
    formula: finite
      ? `${currentStock} ÷ ${burnRatePerDay}/day = ${round1(daysUntilZero)} days`
      : `${currentStock} ÷ ${burnRatePerDay}/day = no depletion at this rate`,
  };
}
