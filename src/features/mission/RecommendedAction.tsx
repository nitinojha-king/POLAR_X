"use client";

/**
 * P1-1 — "Recommended Next Action" panel.
 * Sits at the very top of Mission Overview: ONE suggestion, ONE owner,
 * ONE button. AI suggests — the human decides (the button opens the
 * linked record; nothing executes by itself).
 */
import { useState } from "react";
import { Target, ChevronRight } from "lucide-react";
import { usePolar } from "@/lib/polar-store";

export function RecommendedAction() {
  const openExpedition = usePolar((s) => s.openExpedition);
  const [details, setDetails] = useState(false);

  return (
    <div data-tour="rec-action" className="border-l-4 border-l-emerald-500 bg-emerald-50 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <Target className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-emerald-700">
            Recommended next action
          </p>
          <p className="mt-1 text-[17px] font-bold leading-snug text-slate-900 md:text-lg">
            Contact ANT-09 and hold Zone B movement until the 18:00 weather update.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-600">
            <span>Owner: Cmdr. V. Vance</span>
            <span aria-hidden>·</span>
            <span>Reason: Weather window + stale check-in</span>
            <span aria-hidden>·</span>
            <span>Data age: 31 min</span>
            <button
              type="button"
              onClick={() => setDetails((d) => !d)}
              aria-expanded={details}
              className="font-semibold text-emerald-700 underline decoration-dotted underline-offset-2"
            >
              {details ? "Hide why" : "Why this one?"}
            </button>
          </div>
          {details && (
            <ul className="mt-2 space-y-1 text-[12.5px] leading-snug text-slate-600">
              <li>· ANT-09&apos;s last check-in is 31 minutes old — the plan says every 15 minutes.</li>
              <li>· Whiteout chance near Zone B is 64% in the next 24 h; the next forecast lands at 18:00.</li>
              <li>· The system only suggests — a person always makes the call.</li>
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => openExpedition("ant-09")}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-emerald-600"
        >
          Take action <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
