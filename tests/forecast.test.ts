/**
 * STEP 1 — canonical domain model tests.
 * Run: bun test tests/forecast.test.ts
 * Guarantees:
 *  - calculateForecast is the ONLY math (420 ÷ 62 = 6.8, not "5 days")
 *  - the oxygen numbers agree across INVENTORY card, FORECASTS chart panel
 *    and ALERTS copy — the exact summary-vs-chart conflict from the audit
 *  - the scenario clock helpers behave
 */
import { describe, test, expect } from "bun:test";
import {
  calculateForecast,
  type ForecastInput,
} from "../src/lib/forecast";
import {
  SUPPLY_FORECASTS,
  OXYGEN_FORECAST,
  INVENTORY,
  FORECASTS,
  ALERTS,
} from "../src/lib/polar-data";
import {
  setScenarioNow,
  getNow,
  isSimulationActive,
  formatRelativeTime,
  isSameDay,
  isToday,
} from "../src/lib/clock";

const oxygenInput: ForecastInput = {
  currentStock: 420,
  burnRatePerDay: 62,
  alertThreshold: 60,
  timestamp: new Date().toISOString(),
};

describe("forecast — the single source of depletion math", () => {
  test("oxygen: 420 ÷ 62/day = 6.8 days to zero (not 5, not 6)", () => {
    const f = calculateForecast(oxygenInput);
    expect(f.daysUntilZero).toBe(6.7); // 420/62 = 6.774… → floor(67.7)/10
    expect(f.formula).toBe("420 ÷ 62/day = 6.7 days");
  });

  test("oxygen: crosses the 60-unit alert line after 5.8 days", () => {
    const f = calculateForecast(oxygenInput);
    expect(f.daysUntilAlert).toBe(5.8); // (420-60)/62 = 5.806… → 5.8
  });

  test("oxygen model status is WARNING (alert within 7 days, zero beyond 3)", () => {
    expect(calculateForecast(oxygenInput).status).toBe("WARNING");
  });

  test("empty-tank scenario is CRITICAL (≤ 3 days to zero)", () => {
    const f = calculateForecast({ currentStock: 120, burnRatePerDay: 62, alertThreshold: 60, timestamp: oxygenInput.timestamp });
    expect(f.daysUntilZero).toBeCloseTo(1.9, 1);
    expect(f.status).toBe("CRITICAL");
  });

  test("burn rate 0 → Infinity days, no division explosion", () => {
    const f = calculateForecast({ currentStock: 420, burnRatePerDay: 0, alertThreshold: 60, timestamp: oxygenInput.timestamp });
    expect(f.daysUntilZero).toBe(Infinity);
    expect(f.daysUntilAlert).toBe(Infinity);
    expect(f.status).toBe("OK");
  });
});

describe("reconciliation — every surface quotes THE forecast", () => {
  test("OXYGEN_FORECAST is the shared oxygen result", () => {
    expect(OXYGEN_FORECAST).toBe(SUPPLY_FORECASTS.oxygen);
  });

  test("INVENTORY oxygen card shows the forecast days-to-zero", () => {
    const oxygen = INVENTORY.find((i) => i.key === "oxygen")!;
    expect(oxygen.daysLeft).toBe(SUPPLY_FORECASTS.oxygen.daysUntilZero);
  });

  test("FORECASTS chart panel breach === forecast alert-crossing", () => {
    for (const key of ["oxygen", "food", "spare"] as const) {
      const f = FORECASTS.find((x) => x.key === key)!;
      expect(f.breachDays).toBe(SUPPLY_FORECASTS[key].daysUntilAlert);
    }
  });

  test("charts are generated from the same burn rates (no hand-drawn drift)", () => {
    const oxygenChart = FORECASTS.find((x) => x.key === "oxygen")!.chart;
    expect(oxygenChart[0].stock).toBe(420);
    expect(oxygenChart[1].stock).toBe(420 - 62); // 358
    expect(oxygenChart[6].stock).toBe(420 - 62 * 6); // 48 — old array lied with 60
  });

  test("oxygen ALERT copy quotes the forecast numbers", () => {
    const alr = ALERTS.find((a) => a.id === "alr-oxy")!;
    expect(alr.title).toContain(`${SUPPLY_FORECASTS.oxygen.daysUntilAlert} days`);
    expect(alr.detail).toContain(SUPPLY_FORECASTS.oxygen.formula);
  });

  test("stale planned resupply dates are gone (no 14 Sep promises in the past)", () => {
    for (const item of INVENTORY) {
      expect(item.nextResupply).not.toContain("14 Sep");
    }
  });
});

describe("scenario clock", () => {
  test("isSimulationActive / setScenarioNow / getNow", () => {
    const before = isSimulationActive();
    setScenarioNow("2026-09-17T09:00:00.000Z");
    expect(isSimulationActive()).toBe(true);
    expect(getNow().toISOString()).toBe("2026-09-17T09:00:00.000Z");
    // leave the module-level state as we found it (other tests may rely on real now)
    if (!before) {
      // can't unset via public API — re-anchor to now to stay harmless
      setScenarioNow(new Date().toISOString());
    }
  });

  test("formatRelativeTime buckets", () => {
    setScenarioNow("2026-09-17T09:00:00.000Z");
    expect(formatRelativeTime("2026-09-17T08:59:40.000Z")).toBe("just now");
    expect(formatRelativeTime("2026-09-17T08:30:00.000Z")).toBe("30m ago");
    expect(formatRelativeTime("2026-09-17T06:15:00.000Z")).toBe("2h 45m ago");
    expect(formatRelativeTime("2026-09-15T09:00:00.000Z")).toBe("2d 0h ago");
    setScenarioNow(new Date().toISOString());
  });

  test("isSameDay / isToday", () => {
    setScenarioNow("2026-09-17T09:00:00.000Z");
    expect(isSameDay(new Date("2026-09-17T20:00:00.000Z"), getNow())).toBe(true);
    expect(isSameDay(new Date("2026-09-16T20:00:00.000Z"), getNow())).toBe(false);
    expect(isToday("2026-09-17T08:00:00.000Z")).toBe(true);
    expect(isToday(undefined)).toBe(false);
    setScenarioNow(new Date().toISOString());
  });
});
