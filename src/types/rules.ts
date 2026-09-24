/**
 * POLAR-X — canonical rule types (P0-1).
 * A rule's threshold is a TYPED object (value + unit) so the same
 * sentence renders identically everywhere — Rules Engine, alert
 * tooltips, the Personnel page — with no contradictory units.
 */

export type ThresholdUnit = "minutes" | "hours" | "days" | "percent" | "kg" | "count";

export interface RuleThreshold {
  value: number;
  unit: ThresholdUnit;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: RuleThreshold; // ← typed, not string
  action: string;
  enabled: boolean;
  triggeredCount: number;
}
