"use client";

import { useMemo, useRef, useState } from "react";
import { Menu, CloudOff, RefreshCw, CircleCheck, Search, Bell, ChevronRight, User, BookOpen } from "lucide-react";
import { usePolar, pendingUpdates } from "@/lib/polar-store";
import { cn } from "@/lib/utils";
import { ALERTS, ALERT_CHAINS, EXPEDITIONS, CARGO, ASSETS, PERSONNEL_UNITS, MISSION_CONTEXT, type View } from "@/lib/polar-data";
import { t } from "@/lib/verbs";
import { SimulationClock } from "@/components/layout/SimulationClock";
import { SeverityBadge } from "@/components/ui/StatusBadge";
import { RuleRef } from "@/components/ui/RuleRef";
import { GlossaryModal } from "@/components/ui/GlossaryModal";

/* ---------------------------------------------------------------- */
/* Mission context strip (spec Screen 1 top bar): expedition name,   */
/* current phase, days to next milestone.                            */
/* ---------------------------------------------------------------- */

function MissionContext() {
  return (
    <div className="hidden min-w-0 flex-col xl:flex" title="Simulated mission context">
      <span className="flex items-center gap-1.5 truncate text-[13px] font-semibold leading-tight text-slate-900">
        {MISSION_CONTEXT.expedition}
        <ChevronRight className="h-3 w-3 text-slate-500" />
        <span className="font-normal text-slate-600">{MISSION_CONTEXT.phase}</span>
      </span>
      <span className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
        Next big delivery: {MISSION_CONTEXT.milestone.label} ·{" "}
        <span className="font-semibold text-amber-700">
          {MISSION_CONTEXT.milestone.inDays === 0 ? "today" : `in ${MISSION_CONTEXT.milestone.inDays} days`}
        </span>
        <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-px text-[10.5px] font-bold uppercase tracking-[0.06em] text-amber-700">
          Demo
        </span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Global ID search — jump straight to any expedition / cargo /      */
/* asset / team record (EXP-411, CG-131, ATV-021, ANT-09 …)          */
/* ---------------------------------------------------------------- */

interface SearchHit {
  key: string;
  label: string;
  sub: string;
  kind: "Expeditions" | "Cargo" | "Equipment" | "People";
  status: string;
  lastUpdate: string;
  go: () => void;
}

const KIND_STATUS: Record<string, string> = {
  OPERATIONAL: "Working well",
  ATTENTION: "Needs attention",
  CRITICAL: "Critical",
  STANDBY: "On standby",
  MAINTENANCE: "Under repair",
  "IN TRANSIT": "On its way",
  LOADING: "Being loaded",
  DELIVERED: "Delivered",
  DELAYED: "Held up",
};

function useSearchIndex() {
  const setView = usePolar((s) => s.setView);
  const openExpedition = usePolar((s) => s.openExpedition);
  const openCargo = usePolar((s) => s.openCargo);
  const openAsset = usePolar((s) => s.openAsset);
  return useMemo<SearchHit[]>(
    () => [
      ...EXPEDITIONS.map((e) => ({
        key: e.id,
        label: `${e.code} — ${e.name}`,
        sub: `Expedition · ${e.location}`,
        kind: "Expeditions" as const,
        status: KIND_STATUS[e.status] ?? e.status,
        lastUpdate: e.activity.at(-1)?.time ? `log ${e.activity.at(-1)?.time}` : "recently",
        go: () => openExpedition(e.id),
      })),
      ...CARGO.map((c) => ({
        key: c.id,
        label: `${c.id} — ${c.description}`,
        sub: `Cargo · ${c.origin} → ${c.destination}`,
        kind: "Cargo" as const,
        status: KIND_STATUS[c.status] ?? c.status,
        lastUpdate: c.eta ? `ETA ${c.eta}` : "recently",
        go: () => openCargo(c.id),
      })),
      ...ASSETS.map((a) => ({
        key: a.id,
        label: `${a.id} — ${a.type}`,
        sub: `Equipment · ${a.location}`,
        kind: "Equipment" as const,
        status: KIND_STATUS[a.status] ?? a.status,
        lastUpdate: "recently",
        go: () => {
          openAsset(a.id);
          setView("assets");
        },
      })),
      ...PERSONNEL_UNITS.map((p) => ({
        key: p.id,
        label: p.unit,
        sub: `People · ${p.lead} · ${p.count} personnel`,
        kind: "People" as const,
        status: KIND_STATUS[p.status] ?? p.status,
        lastUpdate: `checked in ${p.lastCheckIn}`,
        go: () => setView("personnel"),
      })),
    ],
    [setView, openExpedition, openCargo, openAsset]
  );
}

function GlobalSearch() {
  const index = useSearchIndex();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  /* P1-5: partial matching across id, name, location, keywords */
  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return index
      .filter((h) => `${h.label} ${h.sub} ${h.status}`.toLowerCase().includes(needle))
      .slice(0, 9);
  }, [q, index]);

  /* P1-5: grouped results so the popover reads in sections */
  const grouped = useMemo(() => {
    const order: SearchHit["kind"][] = ["Expeditions", "People", "Cargo", "Equipment"];
    return order
      .map((kind) => ({ kind, items: hits.filter((h) => h.kind === kind) }))
      .filter((g) => g.items.length > 0);
  }, [hits]);

  const pick = (h: SearchHit) => {
    h.go();
    setQ("");
    setOpen(false);
  };

  const empty = q.trim().length >= 2 && hits.length === 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-[360px]">
      <div
        className={cn(
          "flex h-10 items-center gap-2 rounded border bg-slate-50 px-2.5 transition-colors",
          open && (hits.length > 0 || empty) ? "border-sky-500" : "border-slate-200"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCursor(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, Math.max(hits.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter" && hits[cursor]) {
              e.preventDefault();
              pick(hits[cursor]);
            } else if (e.key === "Escape") {
              setQ("");
              setOpen(false);
            }
          }}
          placeholder="Search cargo, people, equipment — e.g. ANT-09, oxygen"
          aria-label="Search everything"
          className="w-full bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-500"
        />
      </div>

      {open && (hits.length > 0 || empty) && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            aria-label="Search results"
            className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.16)]"
          >
            {empty ? (
              /* P1-5: designed empty state with search tips */
              <div className="px-4 py-3">
                <p className="text-[13.5px] font-semibold text-slate-800">No results found for “{q.trim()}”</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                  Try searching by: expedition ID (ANT-09), person or team (Amit), or an item (oxygen).
                </p>
              </div>
            ) : (
              grouped.map((g) => (
                <div key={g.kind}>
                  <p className="px-3 pb-1 pt-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    {g.kind} ({g.items.length})
                  </p>
                  {g.items.map((h) => {
                    const flatIndex = hits.indexOf(h);
                    return (
                      <button
                        key={h.key}
                        role="option"
                        aria-selected={flatIndex === cursor}
                        type="button"
                        onMouseEnter={() => setCursor(flatIndex)}
                        onClick={() => pick(h)}
                        className={cn(
                          "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left",
                          flatIndex === cursor ? "bg-sky-100" : "bg-transparent"
                        )}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold text-slate-900">{h.label}</span>
                          <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-px text-[11px] font-bold uppercase tracking-[0.04em] text-slate-600">
                            {h.status}
                          </span>
                        </span>
                        <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-slate-500">
                          {h.sub} · {h.lastUpdate}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Connection simulation controls (offline queue / sync)             */
/* ---------------------------------------------------------------- */

function ConnectionControl() {
  const online = usePolar((s) => s.online);
  const setOnline = usePolar((s) => s.setOnline);
  const syncState = usePolar((s) => s.syncState);
  const pending = usePolar(pendingUpdates);

  /* offline identity = purple (spec #8b5cf6) */
  if (!online) {
    return (
      <div aria-live="polite" aria-atomic="true" className="flex items-center gap-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={false}
          aria-label="Demo control — currently offline, tap to reconnect"
          title="Demo control — pretend the satellite link dropped"
          onClick={() => setOnline(true)}
          className="flex items-center gap-1.5 rounded border border-teal-300 bg-teal-100 px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-teal-700 transition-colors hover:border-teal-500"
        >
          <CloudOff className="h-3.5 w-3.5" />
          Offline
          {pending > 0 && (
            <span className="flex items-center gap-1 rounded bg-teal-500/20 px-1.5 py-0.5 text-[11.5px] text-teal-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
              {pending} waiting
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div aria-live="polite" aria-atomic="true" className="flex items-center gap-1.5">
      <button
        type="button"
        role="switch"
        aria-checked
        aria-label="Demo control — currently connected, tap to go offline"
        title="Demo control — pretend the satellite link dropped"
        onClick={() => setOnline(false)}
        className={cn(
          "flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors",
          syncState === "synced"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
            : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
        )}
      >
        {syncState === "syncing" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CircleCheck className="h-3.5 w-3.5" />}
        {/* STEP 2.2 + STEP 9 — full verb on wide screens, compact "Sim" on
            phones so the top bar never overlaps the hamburger */}
        <span className="hidden sm:inline">
          {syncState === "syncing" ? "Sending…" : syncState === "synced" ? t("Simulated delivery ✓", "All sent ✓") : t("Simulation connected", "Connected")}
        </span>
        <span className="sm:hidden">
          {syncState === "syncing" ? "…" : syncState === "synced" ? t("Sim ✓", "Sent ✓") : t("Sim", "Live")}
        </span>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Black box recorder — always-on badge (spec Feature 8: the badge is
   permanently visible in the top bar; the recorder itself lives in
   the sidebar module of the same name) */

function BlackBoxBadge() {
  return (
    <span
      title="Like an airplane's black box — every position, message, decision and alert is recorded and sealed so it can't be secretly changed."
      className="hidden items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-rose-700 md:inline-flex"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
      {t("Black Box: Sim recording", "Black Box: Recording")}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* Alert bell — live operational alerts with cross-domain chains,    */
/* each jumps to its module (spec feature C)                         */
/* ---------------------------------------------------------------- */

function AlertBell() {
  const setView = usePolar((s) => s.setView);
  const openExpedition = usePolar((s) => s.openExpedition);
  const openAsset = usePolar((s) => s.openAsset);
  const incidents = usePolar((s) => s.incidents);
  const [open, setOpen] = useState(false);
  const [expandedChain, setExpandedChain] = useState<string | null>(null);

  const critActive = incidents.some((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED");
  const count = ALERTS.length + (critActive ? 1 : 0);

  const jump = (goTo: { view: View; expeditionId?: string; assetId?: string }) => {
    if (goTo.expeditionId) openExpedition(goTo.expeditionId);
    else if (goTo.assetId) {
      openAsset(goTo.assetId);
      setView(goTo.view);
    } else setView(goTo.view);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Alerts (${count})`}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded border border-transparent text-slate-600 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-11 z-50 w-[390px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_10px_30px_-6px_rgba(15,23,42,0.16)]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-600">
                Needs attention
              </span>
              <span className="text-[12px] font-semibold text-slate-500">{count} active</span>
            </div>
            <ul className="max-h-[430px] overflow-y-auto">
              {critActive && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setView("emergency");
                      setOpen(false);
                    }}
                    className="flex w-full flex-col gap-0.5 border-b border-slate-100 px-3.5 py-3 text-left transition-colors hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.06em] text-rose-700">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                      Emergency · whiteout incident
                    </span>
                    <span className="text-[13px] font-medium text-slate-800">Response drill in progress — open Emergency</span>
                  </button>
                </li>
              )}
              {ALERTS.map((a) => {
                const chain = ALERT_CHAINS[a.id];
                const expanded = expandedChain === a.id;
                return (
                  <li key={a.id} className="border-b border-slate-100">
                    <div className="px-3.5 py-3 transition-colors hover:bg-slate-100">
                      <button type="button" onClick={() => jump(a.goTo)} className="block w-full text-left">
                    {/* STEP 6.1 — canonical severity badge, never colour alone */}
                    <span className="flex items-center gap-2">
                      <SeverityBadge severity={a.severity} />
                      <span className="text-[12px] font-semibold text-slate-500">· {a.time}</span>
                    </span>
                    <span className="text-[13px] font-semibold text-slate-900">{a.title}</span>
                    <span className="line-clamp-2 text-[12.5px] leading-snug text-slate-500">{a.detail}</span>
                    {/* STEP 11.1 — every alert cites its rule */}
                    {a.ruleId && (
                      <RuleRef ruleId={a.ruleId} condition={a.evaluatedCondition} lastEvaluated={a.lastEvaluated} />
                    )}
                  </button>
                      {chain && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setExpandedChain(expanded ? null : a.id)}
                            className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.05em] text-amber-700 hover:border-amber-400"
                            aria-expanded={expanded}
                          >
                            <span className="h-1 w-1 rounded-full bg-amber-400" />
                            {chain.summary}
                          </button>
                          {expanded && (
                            <ul className="mt-1.5 space-y-1 border-l-2 border-amber-300/50 pl-2.5">
                              {chain.impacts.map((imp) => (
                                <li key={imp} className="text-[12.5px] leading-snug text-slate-600">
                                  {imp}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* P1-3 — glossary entry point                                       */

function GlossaryHelp() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Open glossary — what the words mean"
        title="Glossary — what the words mean"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-sky-700"
      >
        <BookOpen className="h-[18px] w-[18px]" />
      </button>
      <GlossaryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/* ---------------------------------------------------------------- */

export function TopBar() {
  const setSidebarOpen = usePolar((s) => s.setSidebarOpen);
  return (
    <header className="fixed left-0 right-0 top-9 z-40 flex h-16 select-none items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-6 lg:left-72">
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(true)}
          className="rounded border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <MissionContext />
        {/* STEP 4.1 — visible scenario clock next to the expedition name */}
        <SimulationClock />
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-3 md:gap-4">
        <BlackBoxBadge />
        <ConnectionControl />
        <GlossaryHelp />
        <AlertBell />
        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 md:pl-4">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-[13px] font-semibold leading-tight text-slate-900">Cmdr. V. Vance</span>
            <span className="text-[12px] font-medium text-slate-500">Station Leader · Ops</span>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-1 ring-sky-300"
            aria-hidden
          >
            <User className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>
    </header>
  );
}
