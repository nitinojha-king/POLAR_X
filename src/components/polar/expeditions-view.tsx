"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Thermometer,
  Wind,
  Eye,
  Radio,
  Gauge,
  Plus,
  SatelliteDish,
  Phone,
  ClipboardCheck,
  Plane,
  Route as RouteIcon,
  Check,
} from "lucide-react";
import { EXPEDITIONS, ASSETS, EXPEDITION_ENV, EXPEDITION_CREW, MISSION_PHASES, CARGO, type Expedition } from "@/lib/polar-data";
import { usePolar } from "@/lib/polar-store";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader, StatusChip, Meter, Provenance, PrototypeTag, RiskChip, TactButton } from "./ui-bits";

/* border accent per expedition status */
const ACCENT: Record<string, string> = {
  OPERATIONAL: "border-l-sky-500",
  ATTENTION: "border-l-amber-500",
  CRITICAL: "border-l-rose-600",
  STANDBY: "border-l-slate-400",
  MAINTENANCE: "border-l-amber-500",
};

function ManifestCard({ ex, selected, onSelect }: { ex: Expedition; selected: boolean; onSelect: () => void }) {
  const env = EXPEDITION_ENV[ex.id];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-sm border border-slate-200 border-l-4 bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all",
        ACCENT[ex.status],
        selected ? "border-sky-500 ring-1 ring-sky-500" : "hover:border-sky-400"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-start gap-2">
          <span className={cn(
            "shrink-0 rounded-sm px-1.5 py-1 text-center font-tele text-label-micro font-bold leading-tight",
            ex.status === "ATTENTION" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700"
          )}>
            {ex.mission}
            <span className="block text-[10.5px] font-semibold opacity-70">{ex.code}</span>
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-headline-sm font-semibold text-slate-900">{ex.name}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-tele text-label-micro uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{ex.commander}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ex.location}</span>
            </span>
          </span>
        </span>
        <StatusChip status={ex.status} pulse={ex.status === "ATTENTION"} />
      </div>

      <div className="mt-2.5 grid grid-cols-4 gap-1.5 rounded-sm border border-slate-100 bg-slate-50 px-2 py-1.5">
        {[
          ["Temp", env.temp],
          ["Wind", env.wind.split("·")[0]],
          ["Fuel", `${ex.logistics.fuel}%`],
          ["Team", `${ex.personnel} people`],
        ].map(([k, v]) => (
          <span key={k} className="flex flex-col">
            <span className="font-tele text-label-micro uppercase tracking-wider text-slate-600">{k}</span>
            <span className={cn("truncate font-tele text-[12px] font-semibold", k === "FUEL" && ex.logistics.fuel < 50 ? "text-rose-700" : "text-slate-800")}>{v}</span>
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 font-tele text-label-micro uppercase tracking-wider">
        <span className="text-slate-500">
          Route: <span className="font-semibold text-slate-800">{ex.route[0].name} → {ex.route[ex.route.length - 1].name}</span>
        </span>
        <span className="shrink-0 font-semibold text-slate-700">
          {ex.route.filter((r) => r.reached).length}/{ex.route.length} stops · {ex.progress}%
        </span>
      </div>
      <div className="mt-1">
        <Meter value={ex.progress} tone={ex.status === "ATTENTION" ? "warn" : "ice"} />
      </div>
    </button>
  );
}

function RouteStepper({ ex }: { ex: Expedition }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-tele text-label-micro font-bold uppercase tracking-[0.1em] text-slate-500">
          Route progress
        </span>
        <span className="font-tele text-label-micro uppercase text-slate-500">
          Day {ex.dayElapsed} of {ex.durationDays}
        </span>
      </div>
      <div className="mt-5 flex items-start justify-between">
        {ex.route.map((r, i) => {
          const isLast = i === ex.route.length - 1;
          const isCurrent = r.current;
          return (
            <div key={r.name} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-1/2 top-[14px] h-0.5 w-full",
                    r.reached ? "bg-emerald-400" : "bg-slate-300"
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white font-tele text-[11.5px] font-bold",
                  r.reached && !isCurrent
                    ? "border-emerald-500 text-emerald-600"
                    : isCurrent
                      ? "border-amber-500 text-amber-600 ring-4 ring-amber-500/15"
                      : "border-slate-300 text-slate-600"
                )}
              >
                {r.reached && !isCurrent ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn(
                "mt-2 max-w-[110px] truncate font-tele text-label-micro uppercase tracking-wider",
                isCurrent ? "font-bold text-amber-700" : "text-slate-500"
              )}>
                {r.name}
              </span>
              {isCurrent && (
                <span className="mt-0.5 font-tele text-label-micro font-bold uppercase text-amber-700">Reroute needed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MissionPhaseStepper({ ex }: { ex: Expedition }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-tele text-label-micro font-bold uppercase tracking-[0.14em] text-slate-600">
          Mission stages — plan, approve, deploy, track, complete
        </span>
        <span className="font-tele text-label-micro font-bold uppercase text-sky-700">Stage: {MISSION_PHASES[ex.phase]}</span>
      </div>
      <div className="mt-3 flex items-start">
        {MISSION_PHASES.map((p, i) => {
          const done = i < ex.phase;
          const current = i === ex.phase;
          return (
            <div key={p} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
              {i < MISSION_PHASES.length - 1 && (
                <span className={cn("absolute left-1/2 top-[9px] h-0.5 w-full", done ? "bg-emerald-400" : "bg-slate-200")} aria-hidden />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 bg-white font-tele text-[10.5px] font-bold",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : current
                      ? ex.status === "ATTENTION"
                        ? "border-amber-500 text-amber-700 ring-4 ring-amber-400/20"
                        : "border-sky-600 text-sky-700 ring-4 ring-sky-500/20"
                      : "border-slate-300 text-slate-600"
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={cn(
                "mt-1.5 font-tele text-label-micro uppercase tracking-wider",
                current ? "font-bold text-slate-900" : done ? "text-slate-600" : "text-slate-600"
              )}>
                {p}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpeditionDetail({ ex }: { ex: Expedition }) {
  const openAsset = usePolar((s) => s.openAsset);
  const setView = usePolar((s) => s.setView);
  const openCargo = usePolar((s) => s.openCargo);
  const env = EXPEDITION_ENV[ex.id];
  const crew = EXPEDITION_CREW[ex.id] ?? [];
  const fleet = ASSETS.filter((a) => a.expedition === ex.code);
  const hazard = ex.risk === "HIGH" ? "HAZARD: HIGH" : `RISK: ${ex.risk}`;

  return (
    <Panel padded={false} className="overflow-hidden">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-sky-600 px-2 py-0.5 font-tele text-label-micro font-bold tracking-wider text-white">{ex.mission}</span>
              <span className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{ex.code} · {ex.lifecycle}</span>
            </div>
            <h2 className="mt-1 font-display text-headline-lg text-slate-900">{ex.name}</h2>
            <p className="mt-1 max-w-xl text-body-sm leading-relaxed text-slate-600">{ex.objective}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "rounded-sm border px-2 py-1 font-tele text-label-micro font-bold",
              ex.risk === "HIGH" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600"
            )}>
              {hazard}
            </span>
            <span className="flex flex-col text-right">
              <span className="text-[12px] text-slate-500">Arrives in</span>
              <span className="font-tele text-telemetry-md font-bold text-sky-700">T+{ex.durationDays - ex.dayElapsed}d</span>
            </span>
          </div>
        </div>

        {/* ops facts — expedition ID, team, times, weather window */}
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { k: "Mission ID", v: `${ex.mission} / ${ex.code}` },
            { k: "Team", v: `${ex.commander} · ${ex.personnel} people` },
            { k: "Now at", v: ex.location },
            { k: "Left on", v: ex.departure },
            { k: "Back on", v: ex.expectedReturn },
            { k: "Risk", v: ex.risk },
            { k: "Equipment tracked", v: `${ex.assets} total · ${fleet.length} shown` },
            { k: "STATUS", v: `${ex.lifecycle} · DAY ${ex.dayElapsed}/${ex.durationDays}` },
          ].map((t) => (
            <div key={t.k} className="well px-2.5 py-2">
              <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{t.k}</div>
              <div className="mt-0.5 truncate font-tele text-telemetry-sm font-bold text-slate-900" title={t.v}>{t.v}</div>
            </div>
          ))}
        </div>

        {/* weather window */}
        <div
          className={cn(
            "mt-2 flex flex-wrap items-center justify-between gap-2 rounded-sm border p-3",
            ex.weatherWindow.status === "CLOSED"
              ? "border-rose-200 bg-rose-50"
              : ex.weatherWindow.status === "MARGINAL"
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
          )}
        >
          <div className="min-w-0">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-600">Weather window</span>
            <p className="text-body-sm font-medium text-slate-800">{ex.weatherWindow.detail}</p>
          </div>
          <span
            className={cn(
              "rounded-sm border px-2 py-1 font-tele text-label-micro font-bold",
              ex.weatherWindow.status === "CLOSED"
                ? "border-rose-300 bg-white text-rose-700"
                : ex.weatherWindow.status === "MARGINAL"
                  ? "border-amber-300 bg-white text-amber-800"
                  : "border-emerald-300 bg-white text-emerald-700"
            )}
          >
            {ex.weatherWindow.status}
          </span>
        </div>

        {/* mission lifecycle stepper */}
        <div className="mt-3">
          <MissionPhaseStepper ex={ex} />
        </div>

        {/* required cargo */}
        <div className="mt-3 rounded-sm border border-slate-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">Cargo this team needs</span>
            <button
              type="button"
              onClick={() => setView("cargo")}
              className="font-tele text-label-micro font-bold uppercase tracking-wider text-sky-700 hover:underline"
            >
              Open cargo →
            </button>
          </div>
          <div className="mt-2 space-y-1.5">
            {ex.requiredCargo.map((rc) => {
              const consignment = CARGO.find((c) => c.id === rc.id);
              return (
                <button
                  key={rc.id}
                  type="button"
                  onClick={() => openCargo(rc.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-sm border border-slate-100 px-2.5 py-2 text-left transition-colors hover:border-sky-400"
                >
                  <span className="min-w-0 font-tele text-telemetry-sm text-slate-800">
                    <span className="font-bold text-sky-700">{rc.id}</span> · {rc.label}
                  </span>
                  {consignment ? (
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={cn(
                        "font-tele text-label-micro font-bold uppercase tracking-wider",
                        consignment.status === "DELAYED" ? "text-rose-700" : consignment.status === "DELIVERED" ? "text-emerald-700" : "text-sky-700"
                      )}>
                        {consignment.status}
                      </span>
                      <span className="font-tele text-label-micro uppercase text-slate-600">Open packing list →</span>
                    </span>
                  ) : (
                    <span className="font-tele text-label-micro uppercase text-slate-600">logged</span>
                  )}
                </button>
              );
            })}
            {ex.requiredCargo.length === 0 && (
              <p className="text-body-sm text-slate-500">No expedition-bound consignments in the current cycle.</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <RouteStepper ex={ex} />
        </div>

        {/* env tiles */}
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { icon: Thermometer, k: "Outside temp", v: env.temp, warn: ex.id === "ant-09" },
            { icon: Gauge, k: "Pressure", v: "968 hPa", warn: false },
            { icon: Wind, k: "Wind", v: env.wind, warn: ex.id === "ant-09" },
            { icon: Eye, k: "Visibility", v: env.visibility, warn: ex.id === "ant-09" },
          ].map((t) => (
            <div key={t.k} className={cn("rounded-sm border p-2.5", t.warn ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white")}>
              <span className="flex items-center gap-1.5 font-tele text-label-micro uppercase tracking-wider text-slate-500">
                <t.icon className="h-3 w-3" />{t.k}
              </span>
              <div className={cn("mt-1 font-tele text-telemetry-md font-bold", t.warn ? "text-rose-700" : "text-slate-900")}>{t.v}</div>
            </div>
          ))}
        </div>

        {/* logistics + risk */}
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">Supplies left</span>
              <span className="font-tele text-label-micro uppercase text-slate-600">DAY {ex.dayElapsed}/{ex.durationDays}</span>
            </div>
            <div className="mt-2.5 space-y-2.5">
              {(
                [
                  ["FUEL", ex.logistics.fuel],
                  ["FOOD", ex.logistics.food],
                  ["MEDICAL", ex.logistics.medical],
                  ["OXYGEN", ex.logistics.oxygen],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <div className="flex items-center justify-between font-tele text-label-micro uppercase tracking-wider">
                    <span className="text-slate-500">{k}</span>
                    <span className={cn("font-bold", v >= 75 ? "text-emerald-700" : v >= 50 ? "text-amber-700" : "text-rose-700")}>{v}%</span>
                  </div>
                  <Meter value={v} className="mt-1" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-sm border border-slate-200 p-3">
            <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">Risk matrix</span>
            <div className="mt-2.5 space-y-1.5">
              {ex.riskMatrix.map((r) => (
                <div key={r.label} className="flex items-start justify-between gap-2 rounded-sm bg-slate-50 px-2 py-1.5">
                  <div className="min-w-0">
                    <span className="font-tele text-telemetry-sm font-semibold text-slate-800">{r.label}</span>
                    <p className="truncate text-body-sm text-slate-600">{r.note}</p>
                  </div>
                  <RiskChip level={r.level} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* crew + fleet */}
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">Team health ({ex.personnel} people)</span>
              <span className="font-tele text-label-micro font-bold uppercase text-emerald-700">All stable</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {crew.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2 rounded-sm border border-slate-100 px-2 py-1.5">
                  <div className="min-w-0">
                    <div className="truncate font-tele text-telemetry-sm font-semibold text-slate-800">
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                      {c.name}
                    </div>
                    <div className="font-tele text-label-micro uppercase tracking-wider text-slate-600">{c.role}</div>
                  </div>
                  <div className="shrink-0 text-right font-tele text-telemetry-sm">
                    <span className="font-bold text-sky-700">HR {c.hr}</span>{" "}
                    <span className="text-slate-600">{c.temp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-sm border border-slate-200 p-3">
            <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">Vehicles & equipment</span>
            <div className="mt-2 space-y-1.5">
              {fleet.length === 0 && (
                <p className="text-body-sm text-slate-500">Shares equipment with the station — open Equipment & Supplies for the full list.</p>
              )}
              {fleet.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => openAsset(a.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-sm border border-slate-100 px-2 py-1.5 text-left transition-colors hover:border-sky-400"
                >
                  <div className="min-w-0">
                    <div className="truncate font-tele text-telemetry-sm font-semibold text-slate-800">{a.id}</div>
                    <div className="truncate font-tele text-label-micro uppercase tracking-wider text-slate-600">{a.type} · {a.location}</div>
                  </div>
                  <StatusChip status={a.status} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* activity timeline */}
        <div className="mt-3 rounded-sm border border-slate-200 p-3">
          <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">Today’s timeline</span>
          <div className="mt-2 space-y-0">
            {ex.activity.map((a, i) => (
              <div key={i} className="relative flex gap-4 pb-3 last:pb-0">
                {i < ex.activity.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" aria-hidden />}
                <span
                  className={cn(
                    "relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-white",
                    a.tone === "alert" ? "border-rose-500" : a.tone === "warn" ? "border-amber-500" : a.tone === "ok" ? "border-emerald-500" : "border-sky-500"
                  )}
                />
                <div className="min-w-0">
                  <span className="font-tele text-telemetry-sm font-bold text-slate-500">{a.time}</span>
                  <p className="text-body-sm text-slate-700">{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <TactButton onClick={() => toast.success("Route check started — the result lands in about 90 seconds (demo)")}>
            <RouteIcon className="h-3.5 w-3.5" /> Check the route
          </TactButton>
          <TactButton variant="danger" onClick={() => toast.success("Air drop request drafted — waiting for the station leader’s approval")}>
            <Plane className="h-3.5 w-3.5" /> Request air drop
          </TactButton>
          <TactButton
            variant="secondary"
            onClick={() => {
              setView("comms");
              toast.success(`Comms channel opened to ${ex.code} — compose in Mission Comms`);
            }}
          >
            <Phone className="h-3.5 w-3.5" /> Message team
          </TactButton>
          <TactButton variant="secondary" onClick={() => toast.success(`Check-in logged for ${ex.code} at ${new Date().toISOString().slice(11, 19)} UTC`)}>
            <ClipboardCheck className="h-3.5 w-3.5" /> Log check-in
          </TactButton>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

export function ExpeditionsView() {
  const selectedId = usePolar((s) => s.selectedExpeditionId) ?? "ant-09";
  const openExpedition = usePolar((s) => s.openExpedition);
  const setView = usePolar((s) => s.setView);
  const [filter, setFilter] = useState<"ALL" | "NOMINAL" | "CAUTION">("ALL");

  const filtered = EXPEDITIONS.filter((e) =>
    filter === "ALL" ? true : filter === "NOMINAL" ? e.status === "OPERATIONAL" : e.status !== "OPERATIONAL"
  );
  const selected = EXPEDITIONS.find((e) => e.id === selectedId) ?? EXPEDITIONS[0];

  const chips: { key: typeof filter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: EXPEDITIONS.length },
    { key: "NOMINAL", label: "On track", count: EXPEDITIONS.filter((e) => e.status === "OPERATIONAL").length },
    { key: "CAUTION", label: "Needs attention", count: EXPEDITIONS.filter((e) => e.status !== "OPERATIONAL").length },
  ];

  return (
    <div data-tour="exp-detail" className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Expedition filters">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={filter === c.key}
              onClick={() => setFilter(c.key)}
              className={cn(
                "rounded-sm border px-2.5 py-1.5 font-tele text-label-caps font-bold uppercase tracking-wider transition-colors",
                filter === c.key
                  ? c.key === "CAUTION"
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-sky-600 bg-sky-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700"
              )}
            >
              {c.label} <span className={cn("ml-1 rounded-sm px-1", filter === c.key && c.key !== "CAUTION" ? "bg-white/20" : "bg-slate-100 text-slate-600")}>{c.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-sm border border-sky-200 bg-sky-50 px-2.5 py-1.5 font-tele text-label-caps font-semibold text-sky-800 md:flex">
            <SatelliteDish className="h-3.5 w-3.5" /> Rescue flight pass in 00:14:22 (demo)
          </span>
          <TactButton onClick={() => toast.success("New expedition draft opened — 4 packing lists ready (demo)")}>
            <Plus className="h-3.5 w-3.5" /> Plan new expedition
          </TactButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* manifest */}
        <div className="flex flex-col gap-4 lg:col-span-5 xl:col-span-5">
          <PanelHeader
            className="panel border-b border-slate-200"
            index="SEC.01"
            title={`Expeditions (${filtered.length})`}
            
          />
          {filtered.map((ex, i) => (
            <div key={ex.id} className={cn(`px-fadeup-${Math.min(i + 1, 4)}`)}>
              <ManifestCard ex={ex} selected={ex.id === selected.id} onSelect={() => openExpedition(ex.id)} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setView("command")}
            className="rounded-sm border border-dashed border-slate-300 bg-white px-3 py-2.5 font-tele text-label-caps font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:border-sky-400 hover:text-sky-700"
          >
            ← Back to overview
          </button>
        </div>

        {/* detail */}
        <div className="lg:col-span-7 xl:col-span-7">
          <div className="lg:sticky lg:top-20">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-tele text-label-micro font-bold uppercase tracking-[0.16em] text-slate-500">
                Selected expedition
              </span>
              <PrototypeTag>Demo expedition feed</PrototypeTag>
              <Provenance />
            </div>
            <ExpeditionDetail ex={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
