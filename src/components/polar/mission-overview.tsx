"use client";

import { useState } from "react";
import {
  Compass,
  Ship,
  Package2,
  Users,
  Siren,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ChevronDown,
  FileDown,
  RadioTower,
  History,
  CalendarClock,
} from "lucide-react";
import { usePolar, pendingUpdates } from "@/lib/polar-store";
import { cn } from "@/lib/utils";
import {
  DOMAIN_STATUS,
  NEEDS_ATTENTION,
  NEXT_UP,
  MISSION_CONTEXT,
  missionReadiness,
  type DomainStatus,
  type AttentionItem,
} from "@/lib/polar-data";
import { Panel, PanelHeader, PageHeader, DataAgeBadge, DataSourceTag, SyncQueueBadge, TactButton } from "./ui-bits";
import { SeverityBadge } from "@/components/ui/StatusBadge";
import { RuleRef } from "@/components/ui/RuleRef";
import { DataQualityLine } from "@/components/ui/DataQualityLine";
import { scenarioIsoMinusMinutes } from "@/lib/clock";
import { OpsMap, StationWeatherStrip } from "./ops-map";
import { CascadeStrip } from "./cascade-modal";
import { RecommendedAction } from "@/features/mission/RecommendedAction";
import { Term } from "@/components/ui/TermTooltip";

/* ------------------------------------------------------------------ */
/* Readiness gauge — big number first (spec Rule 2: 3-second scan)     */
/* ------------------------------------------------------------------ */

function ReadinessGauge() {
  const ready = missionReadiness();
  const tone = ready >= 80 ? "text-emerald-700" : ready >= 60 ? "text-amber-700" : "text-rose-700";
  const stroke = ready >= 80 ? "#10b981" : ready >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <Panel padded={false} className="overflow-hidden">
      <PanelHeader
        title="Are we ready to operate?"
        right={<DataSourceTag kind="verified" label="From NCPOR feed · demo" />}
      />
      <div className="flex flex-wrap items-center gap-5 p-4">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 36 36">
            <path className="text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.6" />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={stroke}
              strokeDasharray={`${ready}, 100`}
              strokeLinecap="round"
              strokeWidth="2.6"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={cn("font-tele text-[30px] font-bold leading-none", tone)}>{ready}%</span>
            <span className="mt-1 text-[10.5px] font-semibold tracking-[0.08em] text-slate-500">ready</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-relaxed text-slate-600">
            One score that combines plans, cargo, supplies, people and emergency <Term word="readiness">readiness</Term>.
            {ready < 80
              ? " It is held down by the oxygen forecast at Zone B and the held-up shipment CG-131 — both are listed under Needs Attention with a suggested next step."
              : " Everything is inside safe limits right now."}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-slate-500">
            <span>Updated 15 min ago</span>
            <span aria-hidden>·</span>
            <span className="text-amber-700">1 decision needs a human</span>
          </div>
          {/* STEP 12.1 — provenance for the readiness score (a critical value) */}
          <DataQualityLine
            value={{
              source: "NCPOR planning feed · demo",
              capturedAt: scenarioIsoMinusMinutes(15),
              confidence: "demo score, not calibrated",
              isSimulated: true,
            }}
          />
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Domain status cards — one per mission domain, 3-second scannable    */
/* ------------------------------------------------------------------ */

const DOMAIN_ICON = { planning: Compass, cargo: Ship, inventory: Package2, personnel: Users, emergency: Siren } as const;
const STATE_ICON = { ok: CheckCircle2, warn: AlertTriangle, crit: XCircle } as const;
const STATE_CLS = {
  ok: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300" },
  warn: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300" },
  crit: { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-300" },
} as const;

function DomainCard({ d, fade }: { d: DomainStatus; fade: number }) {
  const setView = usePolar((s) => s.setView);
  const StateIcon = STATE_ICON[d.state];
  const Icon = DOMAIN_ICON[d.key];
  const cls = STATE_CLS[d.state];
  return (
    <button
      type="button"
      onClick={() => setView(d.view)}
      className={cn(
        "panel panel-hover flex flex-col gap-2 border-l-[3px] p-4 px-fadeup text-left",
        d.state === "crit" ? "border-l-rose-500" : d.state === "warn" ? "border-l-amber-500" : "border-l-emerald-500",
        `px-fadeup-${Math.min(fade, 4)}`
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
          <Icon className="h-4 w-4 text-sky-700" />
          {d.name}
        </span>
        <StateIcon className={cn("h-[18px] w-[18px] shrink-0", cls.text)} />
      </span>
      <span className="truncate text-[16px] font-bold text-slate-900">{d.headline}</span>
      <span className="truncate text-[13px] text-slate-500">{d.detail}</span>
      <span className="mt-0.5 flex flex-wrap items-center gap-2">
        <DataAgeBadge age={d.age} tone={d.state === "crit" ? "crit" : d.state === "warn" ? "warn" : "ok"} label="Updated" />
        <span className="ml-auto inline-flex items-center gap-0.5 text-[11.5px] font-bold uppercase tracking-[0.05em] text-sky-700">
          Open <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Needs Attention — max 3, priority-sorted, with cross-domain chain   */
/* ------------------------------------------------------------------ */

function AttentionRow({ item, fade }: { item: AttentionItem; fade: number }) {
  const setView = usePolar((s) => s.setView);
  const openExpedition = usePolar((s) => s.openExpedition);
  const openAsset = usePolar((s) => s.openAsset);
  const openResupply = usePolar((s) => s.openResupply);
  const [chainOpen, setChainOpen] = useState(false);

  const act = () => {
    if (item.expeditionId) openExpedition(item.expeditionId);
    else if (item.resupply) {
      openResupply(item.resupply);
      setView("logistics");
    } else if (item.assetId) {
      openAsset(item.assetId);
      setView("assets");
    } else setView(item.view);
  };

  const crit = item.severity === "CRITICAL";
  return (
    /* STEP 7.2 — interactive queue row: whole card clickable, hover ring,
       plus the explicit action verb button for keyboard users */
    <div
      role="button"
      tabIndex={0}
      onClick={act}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          act();
        }
      }}
      className={cn(
        "cursor-pointer rounded-md border p-3.5 px-fadeup transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        crit ? "border-rose-300 bg-rose-50" : "border-amber-300 bg-amber-50",
        `px-fadeup-${Math.min(fade, 4)}`
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[14px] font-semibold text-slate-900">
          {crit ? <XCircle className="h-4 w-4 shrink-0 text-rose-700" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />}
          <span className="truncate">{item.what}</span>
        </span>
        {/* STEP 6.1 — canonical severity badge replaces the ad-hoc Urgent/Watch chip */}
        <SeverityBadge severity={item.severity} className="shrink-0" />
      </div>
      <p className="mt-1.5 pl-6 text-[13px] text-slate-600">{item.where}</p>
      {/* STEP 11.1 — rule citation on every attention card */}
      {item.ruleId && (
        <div className="mt-1 pl-6">
          <RuleRef ruleId={item.ruleId} condition={item.evaluatedCondition} lastEvaluated={item.lastEvaluated} />
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
        <DataAgeBadge age={item.age} tone={crit ? "crit" : "warn"} />
        {item.chainSummary && (
          <button
            type="button"
            onClick={() => setChainOpen((o) => !o)}
            aria-expanded={chainOpen}
            className={cn(
              "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.05em] transition-colors",
              crit ? "border-rose-300 bg-transparent text-rose-700 hover:border-rose-400" : "border-amber-300 bg-transparent text-amber-700 hover:border-amber-400"
            )}
          >
            <span className="h-1 w-1 rounded-full bg-current" />
            {item.chainSummary}
          </button>
        )}
      </div>
      {chainOpen && item.chain && (
        <ul className="mt-2 ml-6 space-y-1 border-l-2 border-amber-300/50 pl-3">
          {item.chain.map((c) => (
            <li key={c} className="text-[12.5px] leading-snug text-slate-600">
              {c}
            </li>
          ))}
          <li className="pt-0.5 text-[11.5px] font-bold uppercase tracking-[0.05em] text-slate-500">
            What else does this touch? → open each domain below
          </li>
        </ul>
      )}
      <div className="mt-3 pl-6">
        <span onClick={(e) => e.stopPropagation()}>
          <TactButton variant={crit ? "danger" : "secondary"} onClick={act} className="w-full sm:w-auto">
            {item.action} <ChevronRight className="h-3.5 w-3.5" />
          </TactButton>
        </span>
      </div>
    </div>
  );
}

function NeedsAttention() {
  /* P1-2 — one attention item in view; the rest behind "View all" */
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? NEEDS_ATTENTION : NEEDS_ATTENTION.slice(0, 1);
  return (
    <Panel padded={false} className="overflow-hidden" data-tour="attention">
      <PanelHeader
        title="Needs attention"
        pilot="alert"
        right={
          <span className="rounded bg-amber-100 px-2 py-1 text-[11.5px] font-bold uppercase tracking-[0.05em] text-amber-700">
            {NEEDS_ATTENTION.length} things need a decision
          </span>
        }
      />
      <div className="space-y-3 p-4">
        {visible.map((item, i) => (
          <AttentionRow key={item.id} item={item} fade={i + 1} />
        ))}
        {NEEDS_ATTENTION.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAll((o) => !o)}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-slate-300 bg-slate-50 py-2.5 text-[13.5px] font-bold text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-700"
          >
            {showAll ? "Show fewer" : `View all ${NEEDS_ATTENTION.length} items`}
          </button>
        )}
      </div>
      <div className="border-t border-slate-200 px-3.5 py-2">
        <DataSourceTag kind="simulated" />
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Offline sync queue card (spec: visible, priority-based)             */
/* ------------------------------------------------------------------ */

function SyncQueueCard() {
  const online = usePolar((s) => s.online);
  const setOnline = usePolar((s) => s.setOnline);
  const syncState = usePolar((s) => s.syncState);
  const pending = usePolar(pendingUpdates);

  return (
    <Panel className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">When the internet drops</span>
        <DataSourceTag kind="simulated" label="Demo simulation" />
      </div>
      <SyncQueueBadge pending={pending} lastSync="15 min ago" syncing={syncState === "syncing"} />
      <p className="text-[13px] leading-relaxed text-slate-500">
        {online
          ? "Connected. Anything you do offline is saved on this computer first and sent in order of importance — emergencies always go before routine cargo notes."
          : "No connection — the station keeps working on saved data. Updates pile up below and send automatically, most important first, when the link returns."}
      </p>
      <button
        type="button"
        onClick={() => setOnline(!online)}
        className="self-start rounded border border-slate-300 bg-slate-100 px-3 py-2 text-[12.5px] font-semibold text-slate-700 transition-colors hover:border-teal-500 hover:text-teal-700"
      >
        {online ? "Try it — cut the connection →" : "Bring the connection back →"}
      </button>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* STEP 7.1 — Collapsible section for the MONITOR band (default closed) */
/* ------------------------------------------------------------------ */

function Collapsible({ title, subtitle, children, defaultOpen = false }: { title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold text-slate-900">{title}</span>
          {subtitle && <span className="block text-[12.5px] text-slate-500">{subtitle}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.05em] text-sky-700">
          {open ? "Hide" : "Show"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
        </span>
      </button>
      {open && <div className="border-t border-slate-200 p-4">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* STEP 7.1 — NEXT: the next 3 scheduled milestones, sorted by due      */
/* ------------------------------------------------------------------ */

function NextUp() {
  const setView = usePolar((s) => s.setView);
  const openCargo = usePolar((s) => s.openCargo);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {NEXT_UP.slice(0, 3).map((item, i) => {
        const go = () => {
          if (item.id === "next-cg104") openCargo("CG-104");
          else setView(item.view);
        };
        return (
          <button
            key={item.id}
            type="button"
            onClick={go}
            className={cn(
              "panel panel-hover flex flex-col gap-1.5 p-4 text-left px-fadeup",
              `px-fadeup-${Math.min(i + 1, 4)}`
            )}
          >
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-slate-500">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              {item.dueLabel}
            </span>
            <span className="text-[14.5px] font-semibold leading-snug text-slate-900">{item.title}</span>
            <span className="text-[12.5px] leading-relaxed text-slate-500">{item.detail}</span>
            <span className="mt-1 inline-flex items-center gap-0.5 text-[12px] font-bold uppercase tracking-[0.05em] text-sky-700">
              {item.action} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function MissionOverview() {
  const setView = usePolar((s) => s.setView);
  const setReportOpen = usePolar((s) => s.setReportOpen);

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Is the expedition on track?"
        title="Mission Overview"
        sub={`${MISSION_CONTEXT.expedition} · ${MISSION_CONTEXT.phase} — this screen only shows what needs your attention; everything fine stays one click away.`}
        right={
          <>
            <button
              type="button"
              onClick={() => setView("decisions")}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-4 py-2.5 text-[14px] font-semibold text-slate-800 transition-colors hover:border-sky-400 hover:text-sky-700"
            >
              <History className="h-4 w-4" />
              Past decisions
            </button>
            <button
              type="button"
              onClick={() => setView("comms")}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-4 py-2.5 text-[14px] font-semibold text-slate-800 transition-colors hover:border-sky-400 hover:text-sky-700"
            >
              <RadioTower className="h-4 w-4" />
              Broadcast
            </button>
            <TactButton onClick={() => setReportOpen(true)} icon={<FileDown className="h-3.5 w-3.5" />}>
              Generate Report
            </TactButton>
          </>
        }
      />

      {/* STEP 7.1 — NOW / NEXT / MONITOR replaces the old dense grid */}
      <div className="space-y-6">
        {/* ── NOW — the things that need a human today ── */}
        <section aria-labelledby="now-h">
          <h2 id="now-h" className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            Now — needs a decision
          </h2>
          <div className="space-y-4">
            {/* P1-1 — the single recommended next action */}
            <RecommendedAction />
            <NeedsAttention />
          </div>
        </section>

        {/* ── NEXT — what's coming up (max 3, sorted by due time) ── */}
        <section aria-labelledby="next-h">
          <h2 id="next-h" className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            Next — coming up
          </h2>
          <NextUp />
        </section>

        {/* ── readiness stays visible: it is the 3-second scan answer ── */}
        <ReadinessGauge />

        {/* ── MONITOR — background awareness, collapsed by default ── */}
        <section aria-labelledby="monitor-h" className="space-y-3">
          <h2 id="monitor-h" className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            Monitor — background awareness
          </h2>
          <Collapsible
            title="Five domain status"
            subtitle="Plans · cargo · supplies · people · emergency at a glance"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {DOMAIN_STATUS.map((d, i) => (
                <DomainCard key={d.key} d={d} fade={i + 1} />
              ))}
            </div>
          </Collapsible>
          <Collapsible title="Network map" subtitle="Stations, field teams and the ice-edge corridor">
            <div className="p-1">
              <OpsMap height={300} />
            </div>
            <StationWeatherStrip />
          </Collapsible>
          <Collapsible title="Failure simulator" subtitle="See how one failure cascades across domains">
            <CascadeStrip />
          </Collapsible>
          <Collapsible title="Offline sync queue" subtitle="What happens when the satellite link drops">
            <SyncQueueCard />
          </Collapsible>
        </section>
      </div>
    </div>
  );
}
