/**
 * POLAR-X — canonical rule sentence generator (P0-1).
 * One source of truth for how a rule's threshold is spoken and shown.
 * The SAME sentence must appear on the Rules Engine, alert tooltips
 * and the Personnel page — units can never contradict each other.
 */
import type { Rule, ThresholdUnit } from "@/types/rules";

const SINGULAR: Record<ThresholdUnit, string> = {
  minutes: "minute",
  hours: "hour",
  days: "day",
  percent: "percent",
  kg: "kg",
  count: "item",
};

const PLURAL: Record<ThresholdUnit, string> = {
  minutes: "minutes",
  hours: "hours",
  days: "days",
  percent: "percent",
  kg: "kg",
  count: "items",
};

/** "15 minutes" / "1 minute" / "7 days" / "10 percent" / "1800 kg" */
export function unitLabel(unit: ThresholdUnit, value: number): string {
  return Math.abs(value) === 1 ? SINGULAR[unit] : PLURAL[unit];
}

/** Short suffix for compact chips & editor inputs: min · h · d · % · kg */
export function unitSuffix(unit: ThresholdUnit): string {
  switch (unit) {
    case "minutes":
      return "min";
    case "hours":
      return "h";
    case "days":
      return "d";
    case "percent":
      return "%";
    case "kg":
      return "kg";
    default:
      return "count";
  }
}

/**
 * The canonical sentence for a rule. Time units read
 * "Trigger after 15 minutes of no check-in from a field party";
 * percent reads "Trigger when … falls below 10%";
 * kg reads "Trigger when … goes over 1800 kg".
 */
export function getRuleSentence(rule: Rule): string {
  const { value, unit } = rule.threshold;
  switch (unit) {
    case "percent":
      return `Trigger when ${rule.condition} falls below ${value}%`;
    case "kg":
      return `Trigger when ${rule.condition} goes over ${value} kg`;
    case "count":
      return `Trigger when ${rule.condition} reaches ${value}`;
    default:
      return `Trigger after ${value} ${unitLabel(unit, value)} of ${rule.condition}`;
  }
}

/** Compact badge form of the threshold: < 10% · > 7d · > 15 min · > 1800 kg */
export function getRuleBadge(rule: Rule): string {
  const { value, unit } = rule.threshold;
  if (unit === "percent") return `< ${value}%`;
  if (unit === "kg") return `> ${value} kg`;
  if (unit === "minutes") return `> ${value} min`;
  if (unit === "hours") return `> ${value}h`;
  if (unit === "days") return `> ${value}d`;
  return `> ${value}`;
}

/** Sentence for a custom (edited) value of the same rule — used in version notes. */
export function getRuleSentenceFor(rule: Rule, value: number): string {
  return getRuleSentence({ ...rule, threshold: { ...rule.threshold, value } });
}
