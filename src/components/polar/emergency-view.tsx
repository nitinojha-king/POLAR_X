"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Siren,
  Phone,
  ListChecks,
  ShieldCheck,
  Play,
  Eye,
  Thermometer,
  Timer,
  Users,
  BatteryWarning,
  Plane,
  FileDown,
  Ban,
  Route as RouteIcon,
  CircleCheck,
  Lock,
  ClipboardList,
  History,
  Package2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  EMERGENCY_DRILL,
  HISTORICAL_OPS,
  WHITEOUT_STEPS,
  INCIDENT_STATUSES,
  EXPEDITION_CREW,
  ASSETS,
  INCIDENT_PHASES,
  incidentPhaseIndex,
  whatIfFor,
  buildHandoverPacket,
  lifecycleOf,
  dataStateOf,
  getIncidentLabel,
  type Incident,
} from "@/lib/polar-data";
import { usePolar } from "@/lib/polar-store";
import { useEmergencyCounters, COUNTER_LABELS } from "@/features/emergency/useEmergencyCounters";
import { SeverityBadge, StatusBadge, DataStateBadge } from "@/components/ui/StatusBadge";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Term } from "@/components/ui/TermTooltip";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader, Provenance, PrototypeTag, TactButton, Meter, DataSourceTag } from "./ui-bits";
import { MapControls } from "./ops-map";

/* P1-6 shared zoom steps for schematic maps */
const ZOOMS = [1, 1.6, 2.2];

/* ------------------------------------------------------------------ */
/* live distress counter                                               */
/* ------------------------------------------------------------------ */

function DistressCounter({ startOffset = 138 }: { startOffset?: number }) {
  const [secs, setSecs] = useState(startOffset);
  useEffect(() => {
    const first = setTimeout(() => setSecs(startOffset), 0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [startOffset]);
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <span className="font-tele text-[26px] font-bold leading-none text-rose-700">
      {hh}:{mm}:{ss}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* intercept mini map (dark)                                           */
/* ------------------------------------------------------------------ */

function InterceptMap({ dispatched }: { dispatched: boolean }) {
  /* P1-6 — every map gets zoom + list controls */
  const [zoomIdx, setZoomIdx] = useState(0);
  const [isList, setIsList] = useState(false);
  const zoom = ZOOMS[zoomIdx];

  return (
    <div className="relative rounded-sm border border-slate-200">
      <div className="rail flex items-center justify-between px-2.5 py-1.5">
        <span className="font-tele text-label-micro font-bold uppercase tracking-[0.14em] text-slate-600">Intercept route</span>
        <span className="rounded-sm border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-tele text-label-micro font-bold text-amber-700">SECTOR 1</span>
      </div>
      {isList ? (
        <div className="space-y-1.5 bg-[#e9f1f8] p-2.5" role="list" aria-label="Intercept route as a list">
          {[
            { label: "MAITRI · SV-04 rescue vehicle", status: dispatched ? "Rolling — on scene in 38 min" : "Ready at QRF pad", tone: "ok", age: "position 2 min ago" },
            { label: "INCIDENT #1143 · ANT-09 · Zone B", status: "Whiteout — team sheltered", tone: "alert", age: "beacon 1 min ago" },
          ].map((r) => (
            <div key={r.label} role="listitem" className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2.5 py-2">
              <span className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", r.tone === "ok" ? "bg-emerald-500" : "bg-rose-500")} aria-hidden />
                <span className="font-tele text-[12.5px] font-bold text-slate-900">{r.label}</span>
              </span>
              <span className="text-right">
                <span className={cn("block text-[12px] font-bold", r.tone === "ok" ? "text-emerald-700" : "text-rose-700")}>{r.status}</span>
                <span className="block text-[11.5px] text-slate-500">{r.age}</span>
              </span>
            </div>
          ))}
          <p className="text-center font-tele text-[11.5px] text-slate-500">Route: Ridge A corridor · 12.4 km</p>
        </div>
      ) : (
        <svg viewBox="0 0 300 150" className="h-40 w-full bg-[#e9f1f8]" role="img" aria-label="Intercept route map">
          <defs>
            <pattern id="px-mini-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0 L0 0 0 20" fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="300" height="150" fill="url(#px-mini-grid)" />
          <g transform={`translate(150 75) scale(${zoom}) translate(-150 -75)`}>
            <path d="M0 118 Q60 96 120 112 T300 96" fill="none" stroke="#3b82f6" strokeOpacity="0.35" strokeWidth={1.4 / zoom} strokeDasharray="4 3" />
            <path d="M60 96 L150 62" stroke="#3b82f6" strokeWidth={2 / zoom} strokeDasharray={dispatched ? undefined : "6 4"} className={dispatched ? undefined : "px-dash"} />
            {dispatched && <circle r={4} fill="#60a5fa"><animateMotion dur="6s" repeatCount="indefinite" path="M60 96 L150 62" /></circle>}
            <g transform="translate(60 96)">
              <circle r={6} fill="#ffffff" stroke="#10b981" strokeWidth={2 / zoom} />
              <text y="20" textAnchor="middle" fontSize={9.5} className="font-tele" fontWeight="700" fill="#047857">MAITRI · SV-04 · ready</text>
            </g>
            <g transform="translate(150 62)">
              <circle r={10} fill="none" stroke="#ef4444" strokeWidth={1.4 / zoom} className="px-ping" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
              <circle r={5} fill="#ef4444" />
              <text x="12" y="-6" fontSize={9.5} className="font-tele" fontWeight="700" fill="#b91c1c">INCIDENT #1143 · CRITICAL</text>
              <text x="12" y="4" fontSize={9} className="font-tele" fill="#64748b">WHITEOUT · ANT-09 · ZONE B · beacon 1 min ago</text>
            </g>
            <text x="150" y="140" textAnchor="middle" fontSize={9} className="font-tele" fill="#64748b">
              Route: Ridge A corridor · 12.4 km
            </text>
          </g>
        </svg>
      )}
      <MapControls
        onZoomIn={() => setZoomIdx((i) => Math.min(i + 1, ZOOMS.length - 1))}
        onZoomOut={() => setZoomIdx((i) => Math.max(i - 1, 0))}
        isList={isList}
        onToggleList={() => setIsList((o) => !o)}
        className="top-10"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6-phase incident timeline (spec) with live state mapping            */
/* ------------------------------------------------------------------ */

function PhaseTimeline({ status, halted }: { status: Incident["status"]; halted: boolean }) {
  const idx = incidentPhaseIndex(status, halted);
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-tele text-label-micro font-bold uppercase tracking-[0.12em] text-slate-600">
          Incident timeline — from alarm to all-clear
        </span>
        <span className="font-tele text-label-micro font-bold uppercase text-rose-700">{status}</span>
      </div>
      <div className="mt-3 flex items-start">
        {INCIDENT_PHASES.map((p, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div key={p.key} className="group relative flex min-w-0 flex-1 flex-col items-center text-center" title={p.detail}>
              {i < INCIDENT_PHASES.length - 1 && (
                <span className={cn("absolute left-1/2 top-[9px] h-0.5 w-full", done ? "bg-emerald-500" : current ? "bg-rose-400" : "bg-slate-200")} aria-hidden />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 font-tele text-[10.5px] font-bold",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-[#06281c]"
                    : current
                      ? "border-rose-500 text-rose-700 ring-4 ring-rose-500/25"
                      : "border-slate-300 text-slate-500"
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={cn(
                "mt-1.5 whitespace-nowrap font-tele text-[10px] font-semibold uppercase",
                current ? "font-bold text-rose-700" : done ? "text-slate-700" : "text-slate-500"
              )}>
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 border-t border-slate-200 pt-2 text-[12.5px] text-slate-500">
        Current phase — <span className="font-semibold text-slate-700">{INCIDENT_PHASES[idx].label}</span>: {INCIDENT_PHASES[idx].detail}
      </p>
    </div>
  );
}

/* step index → phase name (9 steps roll up into the 6 phases) */
function phaseOfStep(i: number): string {
  if (i < 2) return "Spotted";
  if (i < 4) return "Located";
  if (i < 6) return "Confirmed";
  if (i < 8) return "Help sent";
  return "On scene";
}

function taskOwner(i: number): string {
  if (i === 3) return "Ops lead (human)";
  if (i === 6) return "Station leader (human approval)";
  if (i === 7) return "SV-04 crew";
  return "System (automatic)";
}

/* ------------------------------------------------------------------ */
/* STEP 3.2 — incident board: Live / Watch / Practice, visibly split   */
/* ------------------------------------------------------------------ */

function IncidentBoard({
  incidents,
  counters,
  phase,
  simIncident,
  onAcknowledge,
  runDrill,
}: {
  incidents: Incident[];
  counters: ReturnType<typeof useEmergencyCounters>;
  phase: Phase;
  simIncident: Incident | null;
  onAcknowledge: (inc: Incident) => void;
  runDrill: () => void;
}) {
  const active = incidents.filter((i) => lifecycleOf(i) !== "RESOLVED" && lifecycleOf(i) !== "DISMISSED");
  /* Live = operational (LIVE/SIMULATED) incidents with CRITICAL|HIGH severity */
  const liveIncidents = active.filter(
    (i) =>
      (dataStateOf(i) === "LIVE" || dataStateOf(i) === "SIMULATED") &&
      (i.severity === "CRITICAL" || i.severity === "HIGH")
  );
  /* Watch = elevated risk, monitoring only — never double-listed with Live */
  const watchIncidents = active.filter(
    (i) =>
      (i.severity === "MEDIUM" || i.severity === "HIGH") &&
      !liveIncidents.includes(i)
  );
  /* Practice = training content — NOT active incidents */
  const practiceIncidents = active.filter((i) => dataStateOf(i) === "PRACTICE");

  return (
    <Panel padded={false} className="overflow-hidden">
      <PanelHeader
        index="SEC.01"
        title="Incident board — live, watch and practice are different things"
        right={<span className="font-tele text-label-micro font-bold uppercase text-slate-500">Same numbers as the banner above</span>}
      />
      {/* canonical counters — identical wording & numbers as the top banner */}
      <CounterRow c={counters} className="p-3" />

      {/* LIVE — active operational incidents requiring response */}
      <section aria-labelledby="live-incidents-h" className="border-t border-slate-200 p-3">
        <h2 id="live-incidents-h" className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Live Incidents{" "}
          <span className="text-rose-700">({counters.openIncidents})</span>
        </h2>
        <p className="text-sm text-slate-500">Active operational incidents requiring response</p>
        <div className="mt-2 border-l-4 border-rose-500 bg-rose-50/30 p-4">
          {liveIncidents.map((inc) => (
            <IncidentRow key={inc.id} inc={inc} onAcknowledge={() => onAcknowledge(inc)} />
          ))}
          {liveIncidents.length === 0 && (
            <p className="text-sm text-slate-500">No live incidents — nothing needs a response right now.</p>
          )}
          {phase === "resolved" && simIncident && (
            <div className="flex items-center justify-between gap-2 bg-emerald-50 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-tele text-telemetry-sm font-bold text-slate-900">
                  {simIncident.id} · WHITEOUT INCIDENT — ANT-09
                  <StatusBadge status="RESOLVED" />
                </div>
                <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">
                  Response SV-04 · 12.4 km · team recovered — drill complete
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WATCH — elevated risk, monitoring only */}
      <section aria-labelledby="watch-items-h" className="border-t border-slate-200 p-3">
        <h2 id="watch-items-h" className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Watch Items{" "}
          <span className="text-amber-700">({counters.watchItems})</span>
        </h2>
        <p className="text-sm text-slate-500">Elevated risk, monitoring only</p>
        <div className="mt-2 border-l-4 border-amber-500 bg-amber-50/30 p-4">
          {watchIncidents.map((inc) => (
            <IncidentRow key={inc.id} inc={inc} onAcknowledge={() => onAcknowledge(inc)} />
          ))}
          {watchIncidents.length === 0 && (
            <p className="text-sm text-slate-500">Nothing on the watch list.</p>
          )}
        </div>
      </section>

      {/* PRACTICE — training content, NOT active incidents */}
      <section aria-labelledby="practice-h" className="border-t border-slate-200 p-3">
        <h2 id="practice-h" className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Practice Scenarios{" "}
          <span className="text-blue-700">({counters.practiceScenarios})</span>
        </h2>
        <p className="text-sm text-slate-500">Training content — NOT active incidents</p>
        <div className="mt-2 space-y-2 border-l-4 border-blue-500 bg-blue-50/30 p-4">
          {practiceIncidents.map((inc) => (
            <IncidentRow key={inc.id} inc={inc} onAcknowledge={() => onAcknowledge(inc)} />
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-tele text-label-caps font-bold uppercase tracking-[0.14em] text-blue-700">
                Whiteout practice drill
              </div>
              <p className="mt-1 max-w-2xl text-body-sm leading-relaxed text-slate-500">
                Run a fake <Term word="whiteout">whiteout</Term> emergency at Zone B to walk the full 6-step workflow —
                alarm, locate, confirm, send help, on scene, review — with a person&apos;s approval before anyone is
                dispatched. It appears under Live Incidents only while the drill runs, and it is always marked{" "}
                <span className="font-semibold">Simulated</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={runDrill}
              className="inline-flex shrink-0 items-center gap-2 rounded-sm border-2 border-rose-500 bg-rose-500 px-5 py-3 font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-rose-400"
            >
              <Play className="h-4 w-4" /> Start practice drill
            </button>
          </div>
        </div>
      </section>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* main view                                                           */
/* ------------------------------------------------------------------ */

type Phase = "idle" | "active" | "resolved";

/* P0-2/STEP 3.1 — the canonical counters, rendered identically in the top
   banner and the incident sections. One component = zero drift. */
function CounterRow({ c, className }: { c: ReturnType<typeof useEmergencyCounters>; className?: string }) {
  const items = [
    { k: COUNTER_LABELS.openIncidents, v: c.openIncidents, tone: "text-slate-900", icon: ListChecks },
    { k: COUNTER_LABELS.criticalIncidents, v: c.criticalIncidents, tone: c.criticalIncidents > 0 ? "text-rose-700" : "text-slate-900", icon: Siren },
    { k: COUNTER_LABELS.watchItems, v: c.watchItems, tone: "text-amber-700", icon: Eye },
    { k: COUNTER_LABELS.practiceScenarios, v: c.practiceScenarios, tone: "text-blue-700", icon: Play },
    { k: COUNTER_LABELS.resolvedToday, v: c.resolvedToday, tone: "text-emerald-700", icon: CircleCheck },
  ];
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5", className)}>
      {items.map((s) => (
        <div key={s.k} className="well px-3 py-2">
          <div className="flex items-center gap-1 font-tele text-label-micro uppercase tracking-wider text-slate-500">
            <s.icon className="h-3 w-3" /> {s.k}
          </div>
          <div className={cn("mt-0.5 font-tele text-telemetry-lg font-bold", s.tone)}>
            {s.v}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmergencyView() {
  const incidents = usePolar((s) => s.incidents);
  const simulateEmergency = usePolar((s) => s.simulateEmergency);
  const validateRoute = usePolar((s) => s.validateRoute);
  const haltMovement = usePolar((s) => s.haltMovement);
  const authorizeDispatch = usePolar((s) => s.authorizeDispatch);
  const acknowledgeIncident = usePolar((s) => s.acknowledgeIncident);
  const resetDrill = usePolar((s) => s.resetDrill);
  const openAsset = usePolar((s) => s.openAsset);
  const recordDecision = usePolar((s) => s.recordDecision);

  const simIncident = incidents.find((i) => i.simulated) ?? null;
  const resolved = simIncident?.status === "RESOLVED";
  const phase: Phase = !simIncident ? "idle" : resolved ? "resolved" : "active";

  /* P0-2 — one hook, one truth, shown in two places */
  const counters = useEmergencyCounters(incidents);

  const [auth, setAuth] = useState(false);
  const [whatIfId, setWhatIfId] = useState<string | null>(null);
  /* P0-3 — confirmation state for high-consequence actions */
  const [confirmDrill, setConfirmDrill] = useState(false);
  const [ackTarget, setAckTarget] = useState<Incident | null>(null);
  /* P1-2 — history hidden by default */
  const [showHistory, setShowHistory] = useState(false);

  const step = simIncident?.step ?? -1;
  const routeValidated = simIncident?.routeValidated ?? false;
  const halted = simIncident?.halted ?? false;
  const canApprove = routeValidated && step >= 5;
  const isDispatching = simIncident?.status === "APPROVED" || simIncident?.status === "DISPATCHED" || simIncident?.status === "RESPONDING";

  const historyRows = useMemo(() => {
    const rows = [...HISTORICAL_OPS];
    if (phase === "resolved" && simIncident) {
      rows.unshift({
        id: simIncident.id,
        sector: `${simIncident.location} · ANT-09`,
        crisis: "Whiteout entrapment — team sheltered in place, SV-04 dispatched after route validation",
        asset: "SV-04 · rescue vehicle",
        response: "00h 38m",
        resolution: "Team escorted back to Zone B camp. Whiteout hold protocol confirmed effective; drill logged.",
        outcome: "SUCCESS",
      });
    }
    return rows;
  }, [phase, simIncident]);

  const whatIf = whatIfId ? (() => {
    const row = historyRows.find((r) => r.id === whatIfId);
    return row ? whatIfFor(row.id, row.crisis) : null;
  })() : null;

  const crew = EXPEDITION_CREW["ant-09"];
  const involvedAssets = ASSETS.filter((a) => ["SV-04", "ATV-021", "DRONE-104"].includes(a.id));

  const exportHandover = () => {
    if (!simIncident) return;
    const json = buildHandoverPacket({
      incident: simIncident,
      step,
      routeValidated,
      halted,
      status: simIncident.status,
      approval: simIncident.status === "APPROVED" || isDispatching || resolved
        ? "Cmdr. V. Vance · Directorate authorization (human sign-off)"
        : undefined,
    });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `POLAR-X_handover_${simIncident.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Handover file downloaded — sized for a slow satellite link (demo)", { duration: 4500 });
  };

  const runDrill = () => {
    /* P0-3: creating a drill incident is high-consequence — confirm first */
    setConfirmDrill(true);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* ---------- top bar: active incidents + create incident ---------- */}
      <div className="panel flex flex-wrap items-center justify-between gap-4 p-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-rose-300 bg-rose-50">
            <Siren className={cn("h-5 w-5", phase === "active" ? "animate-pulse text-rose-700" : "text-rose-700")} />
          </span>
          <div>
            <div className="font-tele text-label-micro font-bold uppercase tracking-[0.16em] text-slate-500">
              Emergency response · what happened and who&apos;s responding
            </div>
            <div className="font-display text-headline-sm font-semibold text-slate-900" role="status" aria-live="polite">
              {phase === "active"
                ? `1 critical incident happening now — ${simIncident?.id}`
                : phase === "resolved"
                  ? "0 live incidents — the last practice drill is closed"
                  : `${counters.openIncidents} live incident${counters.openIncidents === 1 ? "" : "s"} · ${counters.watchItems} on watch · ${counters.criticalIncidents} critical`}
            </div>
            {/* P0-2: canonical counters — same component as the section below */}
            <CounterRow c={counters} className="mt-2.5 max-w-xl" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-tele text-[12px] font-bold uppercase tracking-[0.08em] text-slate-600">
            Practice runs: {phase === "resolved" ? "1 (passed)" : "0"}
          </span>
          <button
            type="button"
            onClick={runDrill}
            className="group inline-flex items-center gap-2 rounded-sm border-2 border-rose-500 bg-rose-500 px-4 py-2.5 font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-rose-400"
          >
            <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
            Start practice drill
          </button>
        </div>
      </div>

      {/* ---------- P0-3 confirmations ---------- */}
      <ConfirmationModal
        open={confirmDrill}
        onClose={() => setConfirmDrill(false)}
        onConfirm={() => {
          simulateEmergency();
          toast.error("Practice drill started — whiteout at Zone B, team ANT-09 (nothing is real)", { duration: 5000 });
        }}
        action="Create practice drill incident"
        target="ANT-09 · Research Zone B"
        priority="CRITICAL"
        consequence="Creates a fake whiteout drill with the full 6-step workflow — no real data is touched"
        isSimulated
        approver="Cmdr. V. Vance"
        confirmLabel="Confirm & Start Drill"
      />
      <ConfirmationModal
        open={ackTarget !== null}
        onClose={() => setAckTarget(null)}
        onConfirm={() => {
          if (ackTarget) {
            acknowledgeIncident(ackTarget.id);
            toast.success(`${ackTarget.id} acknowledged — marked as resolved (demo)`);
          }
        }}
        action="Acknowledge & close incident"
        target={ackTarget ? `${ackTarget.id} · ${ackTarget.title}` : ""}
        priority={ackTarget?.severity ?? "MEDIUM"}
        consequence="Marks the incident resolved and adds it to the incident log"
        isSimulated
        approver="Cmdr. V. Vance"
        confirmLabel="Confirm & Acknowledge"
      />

      {/* ---------- resolved banner ---------- */}
      {phase === "resolved" && (
        <div className="px-fadeup rounded-md border-2 border-emerald-500 bg-emerald-500 p-4 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-white/40 bg-white/15">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="font-tele text-label-micro font-bold uppercase tracking-[0.16em] text-emerald-50">
                  INCIDENT {simIncident?.id} · closed
                </div>
                <div className="font-display text-headline-sm font-semibold">
                  Practice drill complete — everyone accounted for, rescue vehicle stood down
                </div>
              </div>
            </div>
            <TactButton variant="secondary" onClick={() => resetDrill()}>
              <Play className="h-3.5 w-3.5" /> Run another drill
            </TactButton>
          </div>
        </div>
      )}

      {/* ---------- active incident ---------- */}
      {phase === "active" && simIncident && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            <Panel padded={false} className="overflow-hidden">
              {/* critical banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-rose-500 px-3.5 py-2.5 text-white">
                <span className="flex items-center gap-2 font-tele text-label-caps font-bold uppercase tracking-[0.12em]">
                  <Siren className="h-4 w-4 animate-pulse" /> Top emergency · {simIncident.id} · {simIncident.time} UTC
                </span>
                <span className="flex items-center gap-2">
                  <span className="rounded-sm border border-white/40 bg-white/10 px-2 py-1 font-tele text-label-micro font-bold uppercase tracking-wider"><Term word="beacon">Emergency beacon</Term> 406 MHz</span>
                  <span className="rounded-sm border border-white/40 bg-white/10 px-2 py-1 font-tele text-label-micro font-bold uppercase tracking-wider">Beacon: on</span>
                </span>
              </div>

              <div className="p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-headline-md text-slate-900">
                      WHITEOUT INCIDENT — ANT-09 · RESEARCH ZONE B
                    </h2>
                    <p className="mt-1 max-w-2xl text-body-sm leading-relaxed text-slate-600">
                      Ground blizzard dropped visibility below 100 m across the Geological Grid. The ANT-09 team (3 personnel, lead Dr. Vikram Roy)
                      is sheltered in place at the camp cache. The system matched the beacon with team data and prepared a response —
                      sending help needs <span className="font-semibold text-slate-800">a route check and a person’s approval</span>.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-slate-500">Time since the alarm</div>
                    <div className="mt-0.5"><DistressCounter key={simIncident.id} /></div>
                    <div className="text-[12px] text-slate-500">Started {simIncident.time} UTC</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {[
                    { icon: Eye, k: "Visibility", v: "< 100 m", sub: "Ground blizzard", bad: true },
                    { icon: Thermometer, k: "Temperature", v: EMERGENCY_DRILL.ambient, sub: EMERGENCY_DRILL.ambientTrend, bad: true },
                    { icon: Timer, k: "Safe in shelter", v: EMERGENCY_DRILL.hypoWindow, sub: "With camp shelter", bad: false },
                    { icon: BatteryWarning, k: "Radio battery", v: `${EMERGENCY_DRILL.commsBattery}%`, sub: "Satellite radio", bad: true },
                  ].map((t) => (
                    <div key={t.k} className={cn("rounded-sm border p-2.5", t.bad ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50")}>
                      <span className="flex items-center gap-1.5 font-tele text-label-micro uppercase tracking-wider text-slate-500">
                        <t.icon className="h-3 w-3" />{t.k}
                      </span>
                      <div className={cn("mt-1 font-tele text-telemetry-md font-bold", t.bad ? "text-rose-700" : "text-slate-900")}>{t.v}</div>
                      <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{t.sub}</div>
                      {t.k === "COMMS BANK" && <Meter value={EMERGENCY_DRILL.commsBattery} tone="alert" className="mt-1.5" />}
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-tele text-label-micro uppercase tracking-wider text-slate-600">
                    People affected: {EMERGENCY_DRILL.crewAtRisk} · lead {EMERGENCY_DRILL.crewLead} · all sheltered
                  </span>
                  {halted && (
                    <span className="rounded-sm border border-amber-300 bg-amber-100 px-1.5 py-0.5 font-tele text-label-micro font-bold uppercase tracking-wider text-amber-700">
                      Movement stopped in the zone
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <PhaseTimeline status={simIncident.status} halted={halted} />
                </div>
              </div>

              {/* 9-step response chain grouped under phases */}
              <div className="border-t border-slate-200 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-tele text-label-caps font-bold uppercase tracking-[0.14em] text-slate-700">Response tasks — in order</span>
                  <span className="font-tele text-label-micro uppercase text-slate-500">Follows the station emergency plan</span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {WHITEOUT_STEPS.map((s, i) => {
                    const done = i <= step;
                    const isRouteStep = i === 3;
                    const isApprovalStep = i === 6;
                    const isDispatchStep = i === 7;
                    const active = isRouteStep && !routeValidated && step >= 2;
                    return (
                      <div
                        key={s.label}
                        className={cn(
                          "rounded-sm border p-2.5",
                          done ? "border-emerald-300 bg-emerald-50" : active ? "border-sky-500 bg-sky-100 focus-shelf" : "border-slate-200 bg-slate-50 opacity-80"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-tele text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            {phaseOfStep(i).toUpperCase()} · TASK {String(i + 1).padStart(2, "0")}
                          </span>
                          {done ? (
                            <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
                          ) : active ? (
                            <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                          ) : (
                            <Lock className="h-3 w-3 text-slate-500" />
                          )}
                        </div>
                        <div className="mt-1 font-display text-body-lg font-semibold leading-tight text-slate-900">{s.label}</div>
                        <p className="mt-1 text-body-sm leading-relaxed text-slate-500">{s.detail}</p>
                        <div className="mt-1 font-tele text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Owner: {taskOwner(i)}
                        </div>

                        {isRouteStep && !done && (
                          <button
                            type="button"
                            disabled={step < 2}
                            onClick={validateRoute}
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-sm border border-sky-600 bg-sky-600 px-2 py-1.5 font-tele text-label-micro font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RouteIcon className="h-3.5 w-3.5" /> Check the route
                          </button>
                        )}
                        {isApprovalStep && !done && (
                          <label className="mt-2 flex cursor-pointer items-center gap-2 font-tele text-label-micro font-bold uppercase tracking-wider text-slate-700">
                            <input
                              type="checkbox"
                              checked={auth}
                              disabled={!canApprove || isDispatching}
                              onChange={(e) => setAuth(e.target.checked)}
                              className="h-3.5 w-3.5 accent-sky-600"
                            />
                            Leader approval (a person signs off)
                          </label>
                        )}
                        {isDispatchStep && !done && (
                          <button
                            type="button"
                            disabled={!auth || !canApprove}
                            onClick={() => {
                              authorizeDispatch();
                              setAuth(false);
                            }}
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-sm bg-rose-500 px-2 py-1.5 font-tele text-label-micro font-bold uppercase tracking-wider text-white transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Plane className="h-3.5 w-3.5" /> Send rescue vehicle
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* recommendation card */}
                {step >= 5 && !isDispatching && (
                  <div className="px-fadeup mt-3 rounded-sm border border-sky-300 bg-sky-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-sky-700">System suggestion</span>
                      <PrototypeTag>AI proposes — humans decide</PrototypeTag>
                    </div>
                    <p className="mt-1.5 font-display text-headline-sm text-slate-900">
                      Send the rescue vehicle once the route is checked — 12.4 km via Ridge A, about 38 minutes.
                    </p>
                    <ul className="mt-2 grid grid-cols-1 gap-1.5 text-body-sm text-slate-600 md:grid-cols-3">
                      <li className="rounded-sm bg-slate-100 px-2.5 py-1.5">Fuel <span className="font-bold text-slate-900">90%</span> — enough for the round trip with spare</li>
                      <li className="rounded-sm bg-slate-100 px-2.5 py-1.5">Rescue winch <span className="font-bold text-slate-900">checked</span> on 05 Sep</li>
                      <li className="rounded-sm bg-slate-100 px-2.5 py-1.5">2 medics + trauma kit <span className="font-bold text-slate-900">on board</span></li>
                    </ul>
                  </div>
                )}

                {/* action bar */}
                {!isDispatching && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 p-3">
                    <span className="font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">Right now:</span>
                    <TactButton variant="secondary" onClick={() => toast.success("Marked as seen — saved to the mission record")}>
                      <ListChecks className="h-3.5 w-3.5" /> Mark as seen
                    </TactButton>
                    <TactButton variant="amber" disabled={halted} onClick={haltMovement}>
                      <Ban className="h-3.5 w-3.5" /> {halted ? "Movement stopped ✓" : "Stop movement"}
                    </TactButton>
                    {!routeValidated && (
                      <span className="font-tele text-label-micro uppercase tracking-wider text-slate-500">
                        → Check the route to unlock the rescue trip
                      </span>
                    )}
                  </div>
                )}

                {isDispatching && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-amber-300 bg-amber-50 p-3">
                    <span className="font-tele text-label-caps font-bold uppercase tracking-wider text-amber-700">
                      Rescue vehicle on its way · about 38 min — confirm when everyone is safe to close the record
                    </span>
                    <TactButton
                      variant="secondary"
                      onClick={() => {
                        acknowledgeIncident(simIncident.id);
                        toast.success("Everyone is safe — incident closed and filed");
                      }}
                    >
                      <ListChecks className="h-3.5 w-3.5" /> Confirm all safe
                    </TactButton>
                  </div>
                )}
              </div>
            </Panel>

            {/* people / assets / tasks + handover */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Panel padded={false} className="overflow-hidden">
                <PanelHeader title="People involved" right={<DataSourceTag kind="simulated" label="Manifest" />} />
                <div className="divide-y divide-slate-100">
                  {crew.map((c) => (
                    <div key={c.name} className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-slate-900">{c.name}</div>
                        <div className="font-tele text-[11.5px] font-bold uppercase tracking-wider text-slate-500">{c.role}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Safe
                        </span>
                        <div className="mt-0.5 font-tele text-[11.5px] text-slate-500">Zone B · sheltered · {c.hr} bpm</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel padded={false} className="overflow-hidden">
                <PanelHeader title="Assets involved" right={<DataSourceTag kind="simulated" label="Registry" />} />
                <div className="divide-y divide-slate-100">
                  {involvedAssets.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => openAsset(a.id)}
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-tele text-[13px] font-bold text-sky-700">{a.id}</div>
                        <div className="font-tele text-[11.5px] uppercase tracking-wider text-slate-500">{a.type} · {a.location}</div>
                      </div>
                      <span className={cn(
                        "shrink-0 rounded border px-1.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider",
                        a.status === "STANDBY" || a.status === "OPERATIONAL" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : a.status === "CRITICAL" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-amber-300 bg-amber-50 text-amber-700"
                      )}>
                        {a.status === "STANDBY" || a.status === "OPERATIONAL" ? "Ready to use" : a.status === "CRITICAL" ? "Out of service" : "Limited use"}
                      </span>
                    </button>
                  ))}
                </div>
              </Panel>
            </div>

            {/* handover packet */}
            <Panel className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-900">
                  <Package2 className="h-4 w-4 text-teal-700" /> Handover file — for a partner team taking over
                </div>
                <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-slate-500">
                  Packs the whole story — what happened, who is involved, what was decided and who approved it — into one file small enough for a slow satellite link.
                </p>
              </div>
              <TactButton onClick={exportHandover} icon={<FileDown className="h-4 w-4" />}>
                Download handover file
              </TactButton>
            </Panel>
          </div>

          {/* right rail */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <Panel padded={false} className="overflow-hidden">
              <PanelHeader index="SEQ.01" title="Camp camera" right={<PrototypeTag>Simulated CAM</PrototypeTag>} />
              <div className="p-3">
                <div className="relative h-44 overflow-hidden rounded-sm bg-slate-200">
                  <div className="grid-bg absolute inset-0 opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-tele text-label-micro uppercase tracking-[0.3em] text-slate-500">— whiteout: the camera can’t see —</span>
                  </div>
                  <span className="absolute left-2 top-2 rounded-sm bg-black/50 px-1.5 py-0.5 font-tele text-label-micro font-bold text-rose-700">
                    Image refresh 0.4 fps (whiteout)
                  </span>
                  <span className="absolute bottom-2 left-2 rounded-sm bg-black/50 px-1.5 py-0.5 font-tele text-label-micro font-bold text-slate-600">
                    ● Camera 04 · Zone B camp shelter
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <TactButton variant="secondary" className="w-full" onClick={() => toast.success("Voice call opened via the relay (demo)")}>
                    <Phone className="h-3.5 w-3.5" /> Call Zone B by voice
                  </TactButton>
                  <TactButton variant="secondary" className="w-full" onClick={() => toast.success("Survival checklist sent to the team (demo)")}>
                    <ListChecks className="h-3.5 w-3.5" /> Send survival checklist
                  </TactButton>
                </div>
              </div>
            </Panel>

            <InterceptMap dispatched={simIncident.status === "DISPATCHED" || simIncident.status === "RESPONDING"} />

            <Panel padded={false} className="overflow-hidden">
              <PanelHeader index="SEQ.02" title="Weather at Zone B" />
              <div className="grid grid-cols-2 gap-2 p-3">
                {[
                  ["Wind", EMERGENCY_DRILL.metar.wind],
                  ["Visibility", EMERGENCY_DRILL.metar.visibility],
                  ["Sky", EMERGENCY_DRILL.metar.wx],
                  ["Updated", EMERGENCY_DRILL.metar.update],
                ].map(([k, v]) => (
                  <div key={k} className="well px-2.5 py-2">
                    <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{k}</div>
                    <div className="mt-0.5 font-tele text-telemetry-sm font-bold text-slate-800">{v}</div>
                  </div>
                ))}
                <p className="col-span-2 text-body-sm leading-relaxed text-slate-500">
                  Approach radar at Maitri operating on battery emergency channel. Flare lighting available on manual trigger.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* STEP 3.2 — the incident board stays visible during a drill too:
          the live incident appears in the red section, watch items in amber */}
      {phase === "active" && (
        <IncidentBoard
          incidents={incidents}
          counters={counters}
          phase={phase}
          simIncident={simIncident}
          onAcknowledge={(inc) => setAckTarget(inc)}
          runDrill={runDrill}
        />
      )}

      {/* ---------- idle/resolved monitoring: STEP 3.2 incident board ---------- */}
      {phase !== "active" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <IncidentBoard
              incidents={incidents}
              counters={counters}
              phase={phase}
              simIncident={simIncident}
              onAcknowledge={(inc) => setAckTarget(inc)}
              runDrill={runDrill}
            />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <Panel padded={false} className="overflow-hidden">
              <PanelHeader index="SEC.02" title="Rescue team readiness" />
              <div className="space-y-2 p-3">
                {[
                  { name: "SV-04 · rescue vehicle", detail: "At Maitri · 12.4 km from Zone B · winch checked", tone: "ok" },
                  { name: "DRONE-104 · drone", detail: "At Maitri · battery 82% · 22 min to Zone B", tone: "ok" },
                  { name: "Medic team · Maitri", detail: "2 medics on call · trauma kit sealed", tone: "ok" },
                  { name: "ATV-021 · transport vehicle", detail: "Repair overdue — can’t be used for rescue", tone: "alert" },
                ].map((r) => (
                  <div key={r.name} className="flex items-start justify-between gap-2 rounded-sm border border-slate-200 px-2.5 py-2">
                    <div className="min-w-0">
                      <div className="font-tele text-telemetry-sm font-semibold text-slate-900">{r.name}</div>
                      <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{r.detail}</div>
                    </div>
                    <span className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      r.tone === "ok" ? "bg-emerald-500" : "animate-pulse bg-rose-500"
                    )} />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => openAsset("SV-04")}
                  className="w-full rounded-sm border border-slate-300 bg-slate-50 px-2 py-1.5 font-tele text-label-caps font-semibold uppercase tracking-wider text-slate-600 transition-colors hover:border-sky-500 hover:text-sky-700"
                >
                  Inspect rescue vehicle →
                </button>
              </div>
            </Panel>
            <InterceptMap dispatched={false} />
          </div>
        </div>
      )}

      {/* ---------- STEP 9.4 — primary action sticky on mobile ---------- */}
      {phase === "idle" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <button
            type="button"
            onClick={runDrill}
            className="flex w-full items-center justify-center gap-2 rounded-sm border-2 border-rose-500 bg-rose-500 px-5 py-3 font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-rose-400 lg:hidden"
          >
            <Play className="h-4 w-4" /> Start practice drill
          </button>
        </div>
      )}

      {/* ---------- what-if rehearsal panel ---------- */}
      {whatIf && (
        <Panel padded={false} className="overflow-hidden border-amber-300 px-fadeup">
          <PanelHeader
            title={`Practice run — if ${whatIf.incidentId} happened today`}
            pilot="warn"
            right={<PrototypeTag>Simulated with current fleet</PrototypeTag>}
          />
          <div className="space-y-3 p-4">
            <p className="text-[13px] font-medium text-slate-800">{whatIf.crisis}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { k: "Closest vehicle", v: whatIf.nearestAsset.id, sub: whatIf.nearestAsset.detail, tone: "text-sky-700" },
                { k: "Medics on shift", v: "2", sub: whatIf.medics, tone: "text-emerald-700" },
                { k: "Weather now", v: whatIf.weather.split("·")[0]?.trim() ?? whatIf.weather, sub: whatIf.weather, tone: "text-slate-800" },
                { k: "Expected response", v: whatIf.projectedResponse.split("—")[0]?.trim() ?? "", sub: whatIf.delta, tone: "text-emerald-700" },
              ].map((c) => (
                <div key={c.k} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                  <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{c.k}</div>
                  <div className={cn("mt-0.5 font-tele text-[15px] font-bold", c.tone)}>{c.v}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-slate-500">{c.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="rounded border border-slate-200 bg-slate-50 p-2.5 text-[12.5px] text-slate-600">
                <span className="font-semibold text-slate-700">Back then:</span> {whatIf.originalResponse}
              </div>
              <div className="rounded border border-emerald-300 bg-emerald-50 p-2.5 text-[12.5px] text-emerald-700">
                <span className="font-semibold">Verdict:</span> {whatIf.verdict}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <TactButton
                variant="secondary"
                onClick={() => {
                  recordDecision({
                    id: `DEC-1070-${whatIf.incidentId.split("-")[1]}`,
                    date: "12 Sep 2026 · rehearsal",
                    title: `Rehearsal logged — ${whatIf.incidentId} against today's fleet`,
                    domain: "Emergency",
                    decision: `${whatIf.verdict} Projected response: ${whatIf.projectedResponse}`,
                    context: {
                      weather: whatIf.weather,
                      assets: `${whatIf.nearestAsset.id} — ${whatIf.nearestAsset.detail}`,
                      trigger: `Failure rehearsal for historical incident ${whatIf.incidentId}`,
                    },
                    approvals: [{ name: "Cmdr. V. Vance", role: "Station Leader · Ops", action: "Logged rehearsal" }],
                    versions: [{ v: "v1.0", who: "Emergency Center", change: "Rehearsal recorded to decision log", time: "12 Sep · now" }],
                    retention: "ACTIVE",
                    replay: [`Original: ${whatIf.originalResponse}`, `Today: ${whatIf.projectedResponse}`, whatIf.delta],
                    status: "APPROVED",
                  });
                  toast.success("Practice run saved to Past decisions");
                }}
              >
                <ClipboardList className="h-3.5 w-3.5" /> Save this practice run
              </TactButton>
              <TactButton variant="secondary" onClick={() => setWhatIfId(null)}>
                Close
              </TactButton>
            </div>
          </div>
        </Panel>
      )}

      {/* ---------- historical incidents — P1-2: collapsible, hidden by default ---------- */}
      <Panel padded={false} className="overflow-hidden">
        <PanelHeader
          index="SEC.03"
          title="Past incidents — what we learned"
          right={
            <>
              <span className="font-tele text-label-micro font-bold uppercase text-sky-700">
                {historyRows.length} past emergencies · everyone brought home
              </span>
              <button
                type="button"
                onClick={() => setShowHistory((o) => !o)}
                aria-expanded={showHistory}
                className="rounded border border-slate-300 bg-slate-50 px-2.5 py-1 font-tele text-[12px] font-bold text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-700"
              >
                {showHistory ? "Hide history" : "View history"}
              </button>
            </>
          }
        />
        {showHistory && (
          <>
        <div className="overflow-x-auto p-1">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 font-tele text-label-micro uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 font-semibold">Incident</th>
                <th className="px-3 py-2 font-semibold">Where</th>
                <th className="px-3 py-2 font-semibold">What happened</th>
                <th className="px-3 py-2 font-semibold">Help sent as</th>
                <th className="px-3 py-2 font-semibold">Response time</th>
                <th className="px-3 py-2 font-semibold">How it ended</th>
                <th className="px-3 py-2 text-right font-semibold">Outcome · practice run</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 align-top transition-colors last:border-0 hover:bg-sky-50/40">
                  <td className="px-3 py-2.5 font-tele text-telemetry-sm font-bold text-sky-700">{r.id}</td>
                  <td className="px-3 py-2.5 text-body-sm text-slate-600">{r.sector}</td>
                  <td className="max-w-[240px] px-3 py-2.5 text-body-sm text-slate-600">{r.crisis}</td>
                  <td className="px-3 py-2.5 text-body-sm text-slate-600">{r.asset}</td>
                  <td className="px-3 py-2.5 font-tele text-telemetry-sm font-bold text-slate-800">{r.response}</td>
                  <td className="max-w-[260px] px-3 py-2.5 text-body-sm text-slate-500">{r.resolution}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={cn(
                      "inline-block rounded-sm border px-1.5 py-0.5 font-tele text-label-micro font-bold",
                      r.outcome === "SUCCESS" ? "border-emerald-300 text-emerald-700" : "border-emerald-300 text-emerald-700"
                    )}>
                      {r.outcome}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWhatIfId(r.id)}
                      className="ml-2 inline-block rounded-sm border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-tele text-label-micro font-bold uppercase text-amber-700 transition-colors hover:border-amber-400"
                    >
                      Try today
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3.5 py-2">
          <Provenance note="From: demo incident reviews" />
          <button type="button" onClick={() => toast.success("Incident history download queued (demo)")} className="flex items-center gap-1.5 font-tele text-label-micro font-bold uppercase tracking-wider text-sky-700 hover:underline">
            <FileDown className="h-3.5 w-3.5" /> Download history
          </button>
        </div>
          </>
        )}
      </Panel>
    </div>
  );
}

function IncidentRow({ inc, onAcknowledge }: { inc: Incident; onAcknowledge: () => void }) {
  const openExpedition = usePolar((s) => s.openExpedition);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:flex-nowrap">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 font-tele text-telemetry-sm font-bold text-slate-900">
          {inc.id} · {inc.title.toUpperCase()}
          {/* STEP 6.1 — canonical badges: icon + word + colour, never colour alone */}
          <SeverityBadge severity={inc.severity} />
          <StatusBadge status={lifecycleOf(inc)} />
          <DataStateBadge dataState={dataStateOf(inc)} />
        </div>
        <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">
          {inc.location} · {inc.time} · {inc.personnel} personnel · {inc.issue} · {getIncidentLabel(inc)}
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => openExpedition("ant-09")}
          className="rounded-sm border border-slate-300 bg-slate-50 px-2 py-1 font-tele text-label-micro font-bold uppercase text-slate-600 transition-colors hover:border-sky-500 hover:text-sky-700"
        >
          View area
        </button>
        <button
          type="button"
          onClick={onAcknowledge}
          className="rounded-sm border border-sky-600 bg-sky-600 px-2 py-1 font-tele text-label-micro font-bold uppercase text-white transition-colors hover:bg-[#1d4ed8]"
        >
          Mark as seen
        </button>
      </div>
    </div>
  );
}
