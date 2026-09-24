/**
 * STEP 3 — emergency severity reconciliation tests.
 * Run: bun test tests/emergency.test.ts
 * Guarantees:
 *  - the counter numbers EQUAL the incident cards they summarise
 *  - Live / Watch / Practice are disjoint, honest buckets
 *  - incident 1143 carries an honest data-state label
 */
import { describe, test, expect } from "bun:test";
import {
  BASE_INCIDENTS,
  SIMULATED_INCIDENT,
  lifecycleOf,
  dataStateOf,
  getIncidentLabel,
  type Incident,
} from "../src/lib/polar-data";
import { computeEmergencyCounters } from "../src/features/emergency/useEmergencyCounters";

/** Mock incident set = the demo's real seed data + the drill incident. */
function getMockIncidents(): Incident[] {
  return [...BASE_INCIDENTS, { ...SIMULATED_INCIDENT }];
}

/** Section lists mirror IncidentBoard's derivation exactly. */
function getSectionLists(incidents: Incident[]) {
  const active = incidents.filter((i) => lifecycleOf(i) !== "RESOLVED" && lifecycleOf(i) !== "DISMISSED");
  const live = active.filter(
    (i) =>
      (dataStateOf(i) === "LIVE" || dataStateOf(i) === "SIMULATED") &&
      (i.severity === "CRITICAL" || i.severity === "HIGH")
  );
  const watch = active.filter((i) => (i.severity === "MEDIUM" || i.severity === "HIGH") && !live.includes(i));
  const practice = active.filter((i) => dataStateOf(i) === "PRACTICE");
  return { live, watch, practice };
}

describe("emergency counters match the cards (reconciliation)", () => {
  test("critical count matches critical cards", () => {
    const incidents = getMockIncidents();
    const counters = computeEmergencyCounters(incidents);
    const criticalCards = incidents.filter(
      (i) => i.severity === "CRITICAL" && lifecycleOf(i) !== "RESOLVED"
    );
    expect(counters.criticalIncidents).toBe(criticalCards.length);
  });

  test("live-incidents count matches live section cards", () => {
    const incidents = getMockIncidents();
    const counters = computeEmergencyCounters(incidents);
    const { live } = getSectionLists(incidents);
    expect(counters.openIncidents).toBe(live.length);
  });

  test("watch count matches watch section cards (never double-listed with live)", () => {
    const incidents = getMockIncidents();
    const counters = computeEmergencyCounters(incidents);
    const { live, watch } = getSectionLists(incidents);
    expect(counters.watchItems).toBe(watch.length);
    expect(live.length + watch.length).toBe(
      incidents.filter(
        (i) =>
          lifecycleOf(i) !== "RESOLVED" &&
          lifecycleOf(i) !== "DISMISSED" &&
          (i.severity === "CRITICAL" || i.severity === "HIGH" || i.severity === "MEDIUM")
      ).length
    );
  });

  test("practice count matches practice section cards", () => {
    const incidents = getMockIncidents();
    const counters = computeEmergencyCounters(incidents);
    const { practice } = getSectionLists(incidents);
    expect(counters.practiceScenarios).toBe(practice.length);
  });

  test("live and watch sections are disjoint", () => {
    const { live, watch } = getSectionLists(getMockIncidents());
    for (const inc of live) expect(watch).not.toContain(inc);
  });

  test("idle state: the whiteout watch item is NOT counted as a live incident", () => {
    const counters = computeEmergencyCounters(BASE_INCIDENTS);
    // INC-1128 is MEDIUM — watch, not live
    expect(counters.openIncidents).toBe(0);
    expect(counters.watchItems).toBe(1);
    expect(counters.criticalIncidents).toBe(0);
  });

  test("drill running: INC-1143 counts as live + critical", () => {
    const counters = computeEmergencyCounters(getMockIncidents());
    expect(counters.openIncidents).toBe(1);
    expect(counters.criticalIncidents).toBe(1);
  });

  test("resolved today counts INC-1121 (resolved this morning)", () => {
    const counters = computeEmergencyCounters(BASE_INCIDENTS);
    expect(counters.resolvedToday).toBe(1);
  });
});

describe("honest data-state labelling", () => {
  test("incident 1143 is labeled practice if not live", () => {
    const incident = getMockIncidents().find((i) => i.id === "1143" || i.id === "INC-1143");
    if (incident && dataStateOf(incident) === "PRACTICE") {
      expect(getIncidentLabel(incident)).toContain("Practice scenario");
    } else {
      // the drill simulates a LIVE-style incident: it must say Simulated, never plain "Live"
      expect(incident).toBeDefined();
      expect(dataStateOf(incident!)).toBe("SIMULATED");
      expect(getIncidentLabel(incident!)).toContain("Simulated");
    }
  });

  test("archived incidents say Archived", () => {
    const inc = BASE_INCIDENTS.find((i) => i.id === "INC-1114")!;
    expect(dataStateOf(inc)).toBe("ARCHIVED");
    expect(getIncidentLabel(inc)).toContain("Archived");
  });

  test("every incident carries a lifecycle the badge system understands", () => {
    for (const inc of getMockIncidents()) {
      expect(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"]).toContain(lifecycleOf(inc));
      expect(["LIVE", "SIMULATED", "PRACTICE", "ARCHIVED"]).toContain(dataStateOf(inc));
    }
  });
});
