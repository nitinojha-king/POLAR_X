"use client";

/**
 * STEP 11.1 — rule reference on every alert.
 * Shows the rule ID, the evaluated condition, when the rule last ran and
 * a jump to the Rules module — so no alert is ever unexplainable.
 */
import { formatRelativeTime } from "@/lib/clock";
import { usePolar } from "@/lib/polar-store";

interface RuleRefProps {
  ruleId: string;
  condition?: string;
  lastEvaluated?: string;
  className?: string;
}

export function RuleRef({ ruleId, condition, lastEvaluated, className }: RuleRefProps) {
  const setView = usePolar((s) => s.setView);
  return (
    <span
      className={`mt-1 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-slate-500 ${className ?? ""}`}
    >
      <span
        title="The rule that produced this alert"
        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700"
      >
        {ruleId}
      </span>
      {condition && <span className="font-medium">{condition}</span>}
      {lastEvaluated && (
        <span className="text-slate-600">· evaluated {formatRelativeTime(lastEvaluated)}</span>
      )}
      {/* span-not-button: RuleRef often renders inside an alert <button>,
          where a nested <button> is invalid HTML */}
      <span
        role="link"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setView("rules");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setView("rules");
          }
        }}
        className="cursor-pointer font-semibold text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        View rule →
      </span>
    </span>
  );
}
