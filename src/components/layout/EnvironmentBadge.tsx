"use client";

/**
 * STEP 2.1 + STEP 10.1 — the ONE consolidated demo surface.
 * The environment badge is the only place with demo controls:
 *   SIMULATION MODE · Scenario time · [Demo controls]
 * Everything (guided tour, scenario guide, reset, full explanation)
 * lives here — operational screens carry ZERO scattered demo copy.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Map, Navigation, RotateCcw, CircleHelp, X } from "lucide-react";
import { getNow, formatAbsoluteTime, isSimulationActive } from "@/lib/clock";
import { GuidedTour } from "./GuidedTour";

const SCENARIO_STEPS: { n: string; title: string; detail: string }[] = [
  { n: "1", title: "Mission Overview — start calm", detail: "One screen answers “are we on track?”: one recommended action, the decision queue, and what's coming up." },
  { n: "2", title: "Open the weather alert", detail: "Click the urgent attention card (or the bell) to see ANT-09: why the team is flagged — check-in age + whiteout risk." },
  { n: "3", title: "Ask the AI Assistant", detail: "Ask “Which expedition needs immediate attention?” — the answer cites its evidence and proposes next steps. It never acts alone." },
  { n: "4", title: "Review the evidence", detail: "Each reason links to the underlying record: check-in age, weather, oxygen forecast, ATV-021 maintenance." },
  { n: "5", title: "Cargo — compare options", detail: "Open Cargo & Shipments: the weight check shows vessel vs air trade-offs for the same shipment." },
  { n: "6", title: "Record a decision", detail: "Accept a recommendation (or act on the alert) → the confirmation dialog shows target, consequence, approver — and the decision is logged." },
  { n: "7", title: "Confirm in simulation mode", detail: "Every consequential action shows the yellow SIMULATED badge — nothing real is ever touched." },
  { n: "8", title: "See the memory", detail: "Past Decisions and the Black Box show the recorded decision with its approval chain and sealed history." },
];

export function EnvironmentBadge() {
  /* time text is mount-gated: server and client first paint agree,
     the live scenario stamp appears right after hydration */
  const [timeLabel, setTimeLabel] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setTimeLabel(formatAbsoluteTime(getNow().toISOString()));
    update();
    const id = window.setInterval(update, 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  const resetDemo = () => {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  if (!isSimulationActive()) {
    return (
      <div
        role="note"
        aria-label="Live operations notice"
        className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center bg-emerald-600 px-3 text-center text-xs font-bold tracking-wide text-white"
      >
        LIVE OPERATIONS
      </div>
    );
  }

  return (
    <div
      role="note"
      aria-label="Simulation mode notice — not for real-world operations"
      className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center gap-2 bg-amber-500 px-3 text-center text-white"
    >
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-white" aria-hidden />
      <span className="truncate text-[13px] font-bold uppercase tracking-[0.1em] sm:text-sm">
        Simulation mode
      </span>
      <span className="hidden truncate text-[12px] font-semibold text-amber-950/90 md:inline">
        {timeLabel ? `Scenario time: ${timeLabel}` : "Scenario clock syncing…"}
      </span>
      <span className="hidden text-[12px] font-semibold text-white/90 lg:inline">
        · Not for real-world operations
      </span>

      {/* the single demo-controls menu */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded border border-white/50 bg-white/15 px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-white/25"
        >
          Demo controls
          <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {menuOpen && (
          <div
            role="menu"
            aria-label="Demo controls"
            className="absolute right-0 top-8 z-[70] w-64 overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-left shadow-[0_10px_30px_-6px_rgba(15,23,42,0.25)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setTourOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            >
              <Navigation className="h-4 w-4 text-sky-600" aria-hidden /> Start guided demo (8 steps)
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setGuideOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            >
              <Map className="h-4 w-4 text-sky-600" aria-hidden /> Scenario guide
            </button>
            <a
              role="menuitem"
              href="/help/simulation"
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            >
              <CircleHelp className="h-4 w-4 text-sky-600" aria-hidden /> How this simulation works
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                resetDemo();
              }}
              className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-2 text-[13px] font-semibold text-amber-800 transition-colors hover:bg-amber-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Reset demo
            </button>
          </div>
        )}
      </div>

      {guideOpen && <ScenarioGuideModal onClose={() => setGuideOpen(false)} />}
      {tourOpen && <GuidedTour open onClose={() => setTourOpen(false)} />}
    </div>
  );
}

function ScenarioGuideModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Judge-facing scenario guide">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="px-fadeup relative w-full max-w-2xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="font-tele text-label-caps font-bold uppercase tracking-[0.14em] text-slate-800">
            Scenario guide — an 8-step demo path
          </span>
          <button type="button" onClick={onClose} aria-label="Close scenario guide" className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-4">
          <ol className="space-y-2">
            {SCENARIO_STEPS.map((s) => (
              <li key={s.n} className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[13px] font-bold text-sky-700">
                  {s.n}
                </span>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{s.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
            Tip: press “Reset demo” before judging to restore the initial scenario state.
          </p>
        </div>
      </div>
    </div>
  );
}
