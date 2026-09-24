"use client";

/**
 * STEP 4.1 — visible scenario clock in the top bar.
 * Shows the same frozen scenario instant the EnvironmentBadge uses, so
 * "what time is it?" has one answer across the whole app.
 */
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getNow, isSimulationActive } from "@/lib/clock";

export function SimulationClock() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setLabel(
        new Date(getNow().toISOString()).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) + " IST"
      );
    update();
    const interval = window.setInterval(update, 60000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      className="hidden items-center gap-2 whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1 text-xs lg:flex"
      aria-label="Scenario clock"
    >
      <Clock className="h-3 w-3 text-slate-500" aria-hidden />
      <span className="font-medium text-slate-700">{label ?? "—"}</span>
      {isSimulationActive() && <span className="font-semibold text-amber-700">· DEMO</span>}
    </div>
  );
}
