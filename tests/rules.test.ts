/**
 * P0-1 unit tests — Rules Engine typed thresholds.
 * Run: bun test tests/rules.test.ts
 * Guarantees: the SAME canonical sentence/badge renders everywhere
 * with CORRECT units (no "10 hours" for a % threshold, ever).
 */
import { describe, test, expect } from "bun:test";
import { RULES } from "../src/lib/polar-data";
import { getRuleSentence, getRuleBadge, unitLabel } from "../src/lib/rules";
import type { OpRule } from "../src/lib/polar-data";

const byId = (id: string): OpRule => {
  const rule = RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`rule ${id} missing`);
  return rule;
};

describe("typed thresholds — canonical values", () => {
  test("R-01 missed check-in is 15 minutes (matches Personnel page protocol)", () => {
    const r = byId("R-01");
    expect(r.threshold).toEqual({ value: 15, unit: "minutes" });
  });

  test("R-02 low spare stock is 10 percent (not hours)", () => {
    const r = byId("R-02");
    expect(r.threshold).toEqual({ value: 10, unit: "percent" });
  });

  test("R-03 inspection overdue is 7 days (not hours)", () => {
    const r = byId("R-03");
    expect(r.threshold).toEqual({ value: 7, unit: "days" });
  });

  test("R-04 payload limit is 1800 kg", () => {
    const r = byId("R-04");
    expect(r.threshold).toEqual({ value: 1800, unit: "kg" });
  });

  test("R-05 stale data is 8 hours", () => {
    const r = byId("R-05");
    expect(r.threshold).toEqual({ value: 8, unit: "hours" });
  });
});

describe("rule displays correct unit", () => {
  test("sentence contains '15 minutes' for R-01", () => {
    expect(getRuleSentence(byId("R-01"))).toContain("15 minutes");
  });

  test("sentence contains '7 days' for R-03 — never hours", () => {
    const s = getRuleSentence(byId("R-03"));
    expect(s).toContain("7 days");
    expect(s).not.toContain("7 hours");
  });

  test("sentence contains '10%' for R-02 — never hours", () => {
    const s = getRuleSentence(byId("R-02"));
    expect(s).toContain("10%");
    expect(s).not.toContain("hours");
  });

  test("sentence contains '1800 kg' for R-04", () => {
    expect(getRuleSentence(byId("R-04"))).toContain("1800 kg");
  });

  test("singular form: value 1 renders '1 minute'", () => {
    expect(unitLabel("minutes", 1)).toBe("minute");
    expect(unitLabel("minutes", 15)).toBe("minutes");
  });
});

describe("rule badge shows correct symbol", () => {
  test("percent badge", () => {
    expect(getRuleBadge(byId("R-02"))).toBe("< 10%");
  });

  test("days badge", () => {
    expect(getRuleBadge(byId("R-03"))).toBe("> 7d");
  });

  test("minutes badge", () => {
    expect(getRuleBadge(byId("R-01"))).toBe("> 15 min");
  });

  test("hours badge", () => {
    expect(getRuleBadge(byId("R-05"))).toBe("> 8h");
  });

  test("kg badge", () => {
    expect(getRuleBadge(byId("R-04"))).toBe("> 1800 kg");
  });
});

describe("every seeded rule conforms to the typed contract", () => {
  test("all rules have a typed threshold with a known unit", () => {
    const units = ["minutes", "hours", "days", "percent", "kg", "count"];
    for (const r of RULES) {
      expect(r.threshold).toBeDefined();
      expect(typeof r.threshold.value).toBe("number");
      expect(r.threshold.value).toBeGreaterThan(0);
      expect(units).toContain(r.threshold.unit);
      expect(r.enabled).toBe(true);
      expect(typeof r.triggeredCount).toBe("number");
    }
  });

  test("sentence and badge agree for every rule (no contradictions)", () => {
    for (const r of RULES) {
      const sentence = getRuleSentence(r);
      const badge = getRuleBadge(r);
      expect(sentence.length).toBeGreaterThan(0);
      expect(badge.length).toBeGreaterThan(0);
      // the number must be identical in sentence and badge
      expect(sentence).toContain(String(r.threshold.value));
      expect(badge).toContain(String(r.threshold.value));
    }
  });
});
