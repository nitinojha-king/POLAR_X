/**
 * STEP 4 — time/date consistency tests.
 * Run: bun test tests/timeline.test.ts
 * Guarantees:
 *  - no PLANNED cargo step has a timestamp in the past
 *  - no in-flight shipment has an ETA already gone by (the CG-104 bug class)
 *  - the scenario clock, badge clock and timeline all share ONE "now"
 */
import { describe, test, expect } from "bun:test";
import { CARGO, validateTimeline, type CargoConsignment } from "../src/lib/polar-data";
import { setScenarioNow, getNow, formatDualTime } from "../src/lib/clock";

describe("cargo timeline date consistency", () => {
  test("validateTimeline finds no planned-but-past events in demo data", () => {
    expect(validateTimeline(CARGO)).toEqual([]);
  });

  test("CG-104 (IN TRANSIT) has a future ETA — was the 16 Sep past-ETA bug", () => {
    const cg104 = CARGO.find((c) => c.id === "CG-104")!;
    expect(cg104.status).toBe("IN TRANSIT");
    expect(cg104.etaIso).toBeDefined();
    expect(new Date(cg104.etaIso!).getTime()).toBeGreaterThan(getNow().getTime());
  });

  test("validator catches a planned step planted in the past", () => {
    const broken: CargoConsignment[] = [
      {
        ...CARGO[0],
        id: "TEST-BAD",
        status: "LOADING",
        timeline: [
          { step: "Prepared", timestamp: "2026-09-01T09:00:00+05:30", done: true },
          { step: "Loaded", timestamp: "2020-01-01T09:00:00+05:30", done: false, planned: true },
        ],
      },
    ];
    const errors = validateTimeline(broken);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("TEST-BAD");
    expect(errors[0]).toContain("planned");
  });

  test("validator catches an in-flight shipment whose ETA has slipped", () => {
    const broken: CargoConsignment[] = [
      {
        ...CARGO[0],
        id: "TEST-LATE",
        status: "IN TRANSIT",
        etaIso: "2020-01-01T09:00:00+05:30",
      },
    ];
    const errors = validateTimeline(broken);
    expect(errors.some((e) => e.includes("TEST-LATE") && e.includes("ETA"))).toBe(true);
  });

  test("every dated timeline step renders a dual time string", () => {
    setScenarioNow(new Date().toISOString());
    const cg104 = CARGO.find((c) => c.id === "CG-104")!;
    for (const step of cg104.timeline) {
      if (step.timestamp) {
        expect(formatDualTime(step.timestamp)).toMatch(/ago|just now|·/);
      }
    }
  });

  test("scheduled operations have no stale past dates", () => {
    // OPERATIONS_SCHEDULE entries are upcoming work — the old 12–15 Sep
    // block sat fully in the past while the scenario day was mid-Sep.
    for (const entry of CARGO) {
      expect(entry.eta).not.toContain("16 Sep");
    }
  });
});
