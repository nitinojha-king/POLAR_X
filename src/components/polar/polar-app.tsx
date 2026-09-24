"use client";

import { useEffect } from "react";
import { usePolar } from "@/lib/polar-store";
import { EnvironmentBadge } from "@/components/layout/EnvironmentBadge";
import { isSimulationActive } from "@/lib/clock";
import { Onboarding } from "@/components/ui/Onboarding";
import { Sidebar, Breadcrumb } from "./sidebar";
import { TopBar } from "./topbar";
import { MissionOverview } from "./mission-overview";
import { ExpeditionsView } from "./expeditions-view";
import { CargoView } from "./cargo-view";
import { InventoryAssetsView } from "./inventory-view";
import { PersonnelView } from "./personnel-view";
import { EmergencyView } from "./emergency-view";
import { DecisionsView } from "./decisions-view";
import { RulesView } from "./rules-view";
import { BlackBoxView } from "./blackbox-view";
import { CommsView } from "./comms-view";
import { AssistantView } from "./assistant-view";
import { ReportModal } from "./report-modal";

const FLOW = "Plan › Track › Manage › Assess › Decide › Respond › Communicate › Report";

export function PolarApp() {
  const view = usePolar((s) => s.view);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="min-h-screen bg-background lg:pl-72">
      {/* STEP 2.1 — environment badge pinned above everything, on every page */}
      <EnvironmentBadge />
      <Sidebar />
      <TopBar />
      <main className="pt-[6.25rem]">
        {/* STEP 2.3 — subtle diagonal watermark while simulation is active */}
        {isSimulationActive() && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.03]"
          >
            <span className="-rotate-45 select-none text-[200px] font-black leading-none text-slate-900">
              SIMULATION
            </span>
          </div>
        )}
        <div className="mx-auto w-full max-w-[1720px] space-y-5 px-4 py-6 md:px-8 md:py-8">
          {/* STEP 8.2 — active-state breadcrumb above every page */}
          <Breadcrumb />
          <div key={view} className="px-fadeup space-y-5">
            {view === "command" && <MissionOverview />}
          {view === "expeditions" && <ExpeditionsView />}
          {view === "cargo" && <CargoView />}
          {(view === "logistics" || view === "assets") && <InventoryAssetsView tab={view === "assets" ? "assets" : "inventory"} />}
          {view === "personnel" && <PersonnelView />}
          {view === "emergency" && <EmergencyView />}
          {view === "decisions" && <DecisionsView />}
          {view === "rules" && <RulesView />}
          {view === "blackbox" && <BlackBoxView />}
          {view === "comms" && <CommsView />}
          {view === "assistant" && <AssistantView />}
          </div>
        </div>
      </main>
      <footer className="mt-4 border-t border-slate-200 bg-slate-50 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12.5px] tracking-[0.06em] text-slate-500">{FLOW}</span>
          <span className="flex items-center gap-3 text-[12.5px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Working prototype · demo data only
            </span>
            <span className="hidden sm:inline">SIH 2026</span>
          </span>
        </div>
        {/* P0-4 — honest-data disclaimer */}
        <p className="mt-2 max-w-4xl text-[12.5px] leading-relaxed text-slate-500">
          This is a simulated demonstration for SIH 2026. No data is from real operations. Confidence values are demo scores, not calibrated safety probabilities.
        </p>
      </footer>
      <ReportModal />
      {/* P1-4 — first-visit onboarding */}
      <Onboarding />
    </div>
  );
}
