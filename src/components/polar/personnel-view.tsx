"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  MapPin,
  Clock,
  ClipboardCheck,
  ArrowRight,
  ChevronDown,
  Radio,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  PERSONNEL_UNITS,
  EXPEDITION_CREW,
  LOCATION_AGE_H,
  locationAgeTone,
  positionStateOf,
  checkInStateOf,
  type PersonnelUnit,
  type PositionState,
  type CheckInState,
} from "@/lib/polar-data";
import { usePolar } from "@/lib/polar-store";
import { RULES } from "@/lib/polar-data";
import { getRuleSentence } from "@/lib/rules";
import { SortToggle, type SortMode } from "@/components/DataAge";
import { formatRelativeTime } from "@/lib/clock";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader, PageHeader, StatusChip, Provenance, TactButton, DataAgeBadge, DataSourceTag } from "./ui-bits";
import { OpsMap } from "./ops-map";

const TONE_DOT: Record<string, string> = {
  info: "border-sky-500",
  ok: "border-emerald-500",
  warn: "border-amber-500",
  alert: "border-rose-500",
};

function checkInTone(lastCheckIn: string): "ok" | "warn" | "crit" {
  const mins = parseInt(lastCheckIn, 10);
  if (Number.isNaN(mins)) return "ok";
  if (mins >= 30) return "warn";
  if (mins >= 15) return "warn";
  return "ok";
}

/* STEP 5.2 — the two signals are DIFFERENT things and get different words,
   icons and colors. Never color alone. */
const POSITION_STATE_VIEW: Record<PositionState, { icon: string; word: string; cls: string }> = {
  FRESH: { icon: "bg-emerald-500", word: "Fresh", cls: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  STALE: { icon: "bg-amber-500", word: "Stale", cls: "border-amber-300 bg-amber-50 text-amber-700" },
  LOST: { icon: "bg-rose-500", word: "Lost", cls: "border-rose-300 bg-rose-50 text-rose-700" },
};

const CHECKIN_STATE_VIEW: Record<CheckInState, { icon: string; word: string; cls: string }> = {
  OK: { icon: "bg-emerald-500", word: "OK", cls: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  OVERDUE: { icon: "bg-amber-500", word: "Overdue", cls: "border-amber-300 bg-amber-50 text-amber-700" },
  MISSING: { icon: "bg-rose-500", word: "Missing", cls: "border-rose-300 bg-rose-50 text-rose-700" },
};

const POSITION_CHECKIN_TOOLTIP =
  "“Last Position” = when their GPS beacon was last received. “Last Check-in” = when they last confirmed they are safe. These are different: a team can have a fresh position but a missed check-in.";

function PositionCheckInGrid({ unit }: { unit: PersonnelUnit }) {
  const posH = LOCATION_AGE_H[unit.id] ?? 1;
  const posState = unit.positionState ?? positionStateOf(posH);
  const checkState = unit.checkInState ?? "OK";
  const posView = POSITION_STATE_VIEW[posState];
  const checkView = CHECKIN_STATE_VIEW[checkState];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-sm border border-slate-200 bg-white p-3">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">Last position received</p>
        <p className="mt-0.5 font-tele text-telemetry-sm font-bold text-slate-900">
          {unit.lastPositionReceivedAt ? formatRelativeTime(unit.lastPositionReceivedAt) : `${posH} h ago`}
        </p>
        <span className={cn("mt-1 inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[12px] font-semibold", posView.cls)}>
          <span aria-hidden className={cn("h-2 w-2 rounded-full", posView.icon)} /> {posView.word}
        </span>
        <p className="mt-1.5 text-[11.5px] text-slate-500">Rule: red after 4 h without a position</p>
      </div>
      <div className="rounded-sm border border-slate-200 bg-white p-3">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">Last check-in received</p>
        <p className="mt-0.5 font-tele text-telemetry-sm font-bold text-slate-900">
          {unit.lastCommunicationAt ? formatRelativeTime(unit.lastCommunicationAt) : unit.lastCheckIn}
        </p>
        <span className={cn("mt-1 inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[12px] font-semibold", checkView.cls)}>
          <span aria-hidden className={cn("h-2 w-2 rounded-full", checkView.icon)} /> {checkView.word}
        </span>
        <p className="mt-1.5 text-[11.5px] text-slate-500">Rule: alert after 15 min without a check-in</p>
      </div>
    </div>
  );
}

function UnitCard({ unit, expanded, onToggle }: { unit: PersonnelUnit; expanded: boolean; onToggle: () => void }) {
  const openExpedition = usePolar((s) => s.openExpedition);
  const setView = usePolar((s) => s.setView);
  const crew = EXPEDITION_CREW[unit.expeditionId] ?? [];
  const ageH = LOCATION_AGE_H[unit.id] ?? 1;
  const tone = locationAgeTone(ageH);
  const overdue = unit.status === "ATTENTION";

  return (
    <div
      className={cn(
        "panel overflow-hidden",
        overdue && "border-amber-300"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-start justify-between gap-2 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "rounded-sm px-1.5 py-0.5 font-tele text-label-micro font-bold",
              overdue ? "bg-amber-100 text-amber-700" : "bg-sky-50 text-sky-700"
            )}>
              {unit.expeditionCode}
            </span>
            <span className="font-display text-headline-sm font-semibold text-slate-900">{unit.unit}</span>
            {/* STEP 5.3 — clarifying tooltip: position ≠ check-in */}
            <span
              role="note"
              title={POSITION_CHECKIN_TOOLTIP}
              aria-label={POSITION_CHECKIN_TOOLTIP}
              className="flex h-4.5 w-4.5 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500"
            >
              ?
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Now at: <span className="font-semibold text-slate-700">{unit.currentLocation}</span></span>
            <span>Lead: <span className="font-semibold text-slate-700">{unit.lead}</span> · {unit.count} on ice</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className={cn(
            "flex items-center gap-1 rounded-sm border px-2 py-1 text-[12px] font-semibold",
            POSITION_STATE_VIEW[unit.positionState ?? "FRESH"].cls
          )}>
            <span aria-hidden className={cn("h-2 w-2 rounded-full", POSITION_STATE_VIEW[unit.positionState ?? "FRESH"].icon)} />
            Position {POSITION_STATE_VIEW[unit.positionState ?? "FRESH"].word}
          </span>
          <span className={cn(
            "flex items-center gap-1 rounded-sm border px-2 py-1 text-[12px] font-semibold",
            CHECKIN_STATE_VIEW[unit.checkInState ?? "OK"].cls
          )}>
            <span aria-hidden className={cn("h-2 w-2 rounded-full", CHECKIN_STATE_VIEW[unit.checkInState ?? "OK"].icon)} />
            Check-in {CHECKIN_STATE_VIEW[unit.checkInState ?? "OK"].word}
          </span>
          <StatusChip status={unit.status} pulse={overdue} />
          <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-slate-200 p-3.5">
          {/* STEP 5.2 — the two timestamps side by side, with their rules */}
          <PositionCheckInGrid unit={unit} />

          {/* crew list — P2-6: units + normal range + trend + privacy + synthetic badge */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                <Users className="h-4 w-4 text-sky-700" /> Team members — showing {crew.length} of {unit.count}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">Synthetic data</span>
                <span
                  title="Vitals are restricted to the Medical Officer — this demo shows synthetic values only."
                  className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500"
                >
                  Access restricted to Medical Officer
                </span>
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {crew.map((c) => {
                const hrTrend = c.hr % 3 === 0 ? "↑" : c.hr % 3 === 1 ? "→" : "↓";
                const hrTone = c.hr > 95 ? "text-amber-700" : "text-emerald-700";
                const tempTrend = c.temp.endsWith("5") ? "↑" : c.temp.endsWith("7") ? "→" : "↓";
                return (
                  <div key={c.name} className="rounded-sm border border-slate-200 px-2.5 py-2">
                    <div className="truncate text-[13px] font-semibold text-slate-800">{c.name}</div>
                    <div className="font-tele text-[11px] font-bold uppercase tracking-wider text-slate-500">{c.role}</div>
                    <div className="mt-1 flex items-center gap-2 font-tele text-[12px] text-slate-600">
                      <span className={cn("h-1.5 w-1.5 rounded-full", overdue && c.role.includes("LEAD") ? "bg-amber-500" : "bg-emerald-500")} />
                      <span title="Normal resting range: 60–100 beats per minute">
                        {c.hr} bpm <span className={hrTone}>{hrTrend}</span>
                      </span>
                      <span aria-hidden>·</span>
                      <span title="Normal core range: 36.1–37.2°C">
                        {c.temp} <span className="text-emerald-700">{tempTrend}</span>
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10.5px] leading-snug text-slate-500">
                      60–100 bpm normal · 36.1–37.2°C normal
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* movement history */}
          <div>
            <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
              Recent movements
            </span>
            <div className="mt-2.5 space-y-0">
              {unit.movementHistory.map((m, i) => (
                <div key={`${m.place}-${i}`} className="relative flex gap-4 pb-3 last:pb-0">
                  {i < unit.movementHistory.length - 1 && (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" aria-hidden />
                  )}
                  <span
                    className={cn(
                      "relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-white",
                      TONE_DOT[m.tone]
                    )}
                  />
                  <div className="min-w-0">
                    <span className="font-tele text-telemetry-sm font-bold text-slate-500">{m.time}</span>
                    <p className="text-body-sm font-medium text-slate-700">{m.place}</p>
                    {m.note && <p className="text-body-sm text-slate-500">{m.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <TactButton onClick={() => openExpedition(unit.expeditionId)}>
              Open plan <ArrowRight className="h-3.5 w-3.5" />
            </TactButton>
            <TactButton
              variant="secondary"
              onClick={() => toast.success(`Check-in request sent to ${unit.expeditionCode} — waiting for their reply (demo)`)}
            >
              <ClipboardCheck className="h-3.5 w-3.5" /> Request check-in
            </TactButton>
            <TactButton
              variant="secondary"
              onClick={() => {
                setView("comms");
                toast.success(`Message channel to ${unit.expeditionCode} opened`);
              }}
            >
              <Radio className="h-3.5 w-3.5" /> Contact team
            </TactButton>
          </div>
        </div>
      )}
    </div>
  );
}

export function PersonnelView() {
  const [openId, setOpenId] = useState<string | null>("unit-09");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "safe" | "overdue">("all");
  /* P2-2 — sort by most urgent / most stale */
  const [sortMode, setSortMode] = useState<SortMode>("urgent");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = PERSONNEL_UNITS.filter((u) => {
      const inStatus =
        statusFilter === "all" ||
        (statusFilter === "overdue" && u.status === "ATTENTION") ||
        (statusFilter === "safe" && u.status !== "ATTENTION");
      const inQuery = !q || `${u.unit} ${u.lead} ${u.currentLocation} ${u.expeditionCode}`.toLowerCase().includes(q);
      return inStatus && inQuery;
    });
    /* P2-2 — most urgent: attention teams first, then oldest check-in;
       most stale: oldest position age first */
    const ageH = (u: (typeof PERSONNEL_UNITS)[number]) => LOCATION_AGE_H[u.id] ?? 1;
    return [...filtered].sort((a, b) => {
      if (sortMode === "stale") return ageH(b) - ageH(a);
      const at = (u: (typeof PERSONNEL_UNITS)[number]) => (u.status === "ATTENTION" ? 0 : 1);
      const s = at(a) - at(b);
      if (s !== 0) return s;
      return ageH(b) - ageH(a);
    });
  }, [query, statusFilter, sortMode]);

  const exceptions = PERSONNEL_UNITS.filter((u) => u.status === "ATTENTION");
  /* P0-1: the missed check-in bar quotes the SAME canonical sentence as the Rules Engine */
  const checkInRule = RULES.find((r) => r.id === "R-01");
  const onIce = PERSONNEL_UNITS.reduce((acc, u) => acc + u.count, 0);
  /* P1-2 — max 5 teams in view */
  const [showAllPeople, setShowAllPeople] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="Where is everyone and are they safe?"
        title="People & Teams"
        sub="Field teams, how they report in, and how fresh each position is — yellow means a position is over 4 hours old, red over 8."
        right={<Provenance note="From: demo field check-ins" />}
      />

      {/* map */}
      <Panel padded={false} className="overflow-hidden">
        <PanelHeader
          title="Team positions — stations & field sites"
          right={<DataSourceTag kind="simulated" label="Demo positions" />}
        />
        <div className="p-3">
          <OpsMap height={330} />
        </div>
      </Panel>

      {/* search + filters */}
      <Panel className="flex flex-wrap items-center gap-4 py-3">
        <label className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role or location…"
            className="w-full rounded border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2 text-body-sm text-slate-800 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { k: "all", label: `All (${PERSONNEL_UNITS.length})` },
            { k: "safe", label: `Safe (${PERSONNEL_UNITS.length - exceptions.length})` },
            { k: "overdue", label: `Overdue (${exceptions.length})` },
          ].map((f) => (
            <button
              key={f.k}
              type="button"
              onClick={() => setStatusFilter(f.k as typeof statusFilter)}
              className={cn(
                "rounded border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                statusFilter === f.k ? "border-sky-500 bg-sky-600 text-white" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-sky-400 hover:text-sky-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SortToggle mode={sortMode} onChange={setSortMode} className="ml-auto" />
        <span className="text-[12px] text-slate-500">{onIce} people in the demo units · 127 in the field overall</span>
      </Panel>

      {/* unit cards — P1-2: max 5 in view, rest behind View all */}
      <div className="space-y-4">
        {(showAllPeople ? rows : rows.slice(0, 5)).map((u) => (
          <UnitCard key={u.id} unit={u} expanded={openId === u.id} onToggle={() => setOpenId(openId === u.id ? null : u.id)} />
        ))}
        {rows.length === 0 && <EmptyState what="teams match" hint={`Nobody matches “${query}”. Try a callsign (ANT-09) or a lead name (Vikram).`} />}
        {rows.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllPeople((o) => !o)}
            className="w-full rounded-md border border-slate-300 bg-slate-50 py-3 text-[13.5px] font-bold text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-700"
          >
            {showAllPeople ? "Show fewer teams" : `View all people (${rows.length} teams on screen · 127 in the field) →`}
          </button>
        )}
      </div>

      {/* missed check-ins bottom bar */}
      {exceptions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
          <span className="flex items-start gap-2.5 text-[13.5px] font-semibold text-amber-700">
            <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>
              Missed check-ins: {exceptions.length} — {exceptions.map((e) => e.expeditionCode).join(", ")} last checked in 31 min ago.
              {checkInRule && (
                <span className="block text-[12.5px] font-medium text-amber-700">
                  Rule {checkInRule.id}: {getRuleSentence(checkInRule)}
                </span>
              )}
            </span>
          </span>
          <TactButton
            variant="amber"
            onClick={() => {
              toast.success("Pause-and-check-in notice sent to ANT-09 (demo)");
            }}
          >
            <Radio className="h-3.5 w-3.5" /> Request check-in now
          </TactButton>
        </div>
      )}
    </div>
  );
}
