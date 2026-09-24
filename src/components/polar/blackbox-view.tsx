"use client";

import { useMemo, useState } from "react";
import {
  CircleDot,
  Database,
  CloudUpload,
  HardDrive,
  Lock,
  Play,
  Search,
  MapPin,
  Radio,
  GitCommitHorizontal,
  BellRing,
  UserCheck,
  CloudSun,
  ArrowRight,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { t } from "@/lib/verbs";
import { usePolar } from "@/lib/polar-store";
import {
  BLACKBOX_STREAMS,
  BLACKBOX_CHAIN,
  BLACKBOX_REPLAY,
  DECISION_WHATIFS,
  type ReplayIncident,
  type DecisionWhatIf,
} from "@/lib/polar-data";
import { PageHeader, Panel, PanelHeader, DataSourceTag, TactButton, ViewMoreHint } from "./ui-bits";

/* ==================================================================
   FEATURE 8 — BLACK BOX RECORDER (spec: "What happened and what did
   we learn?") Evidence: report §6 — three real incidents reviewed.
   Records positions, comms, decisions, alerts, approvals and weather;
   local-first storage with cloud sync; tamper-proof SHA-256 hash
   chain; replay mode with a timeline slider; searchable decision log.
   ================================================================== */

const STREAM_ICON: Record<string, typeof MapPin> = {
  Positions: MapPin,
  Comms: Radio,
  Decisions: GitCommitHorizontal,
  Alerts: BellRing,
  Approvals: UserCheck,
  Weather: CloudSun,
};

const VERDICT_STYLE: Record<DecisionWhatIf["verdict"], string> = {
  BETTER: "border-emerald-300 bg-emerald-50 text-emerald-700",
  WORSE: "border-rose-300 bg-rose-50 text-rose-700",
  SIMILAR: "border-amber-300 bg-amber-50 text-amber-700",
};

/* ---------------- recorder status panel --------------------------- */

function RecorderPanel() {
  const online = usePolar((s) => s.online);
  const [verifying, setVerifying] = useState(false);

  const verify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      toast.success("Record checked — all 1,286 entries intact. Nothing has been tampered with.", { duration: 5000 });
    }, 900);
  };

  return (
    <Panel padded={false} className="overflow-hidden">
      <PanelHeader
        title="Recorder — always active"
        pilot="alert"
        right={
          <span className="inline-flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-2 py-0.5 font-tele text-[12px] font-bold uppercase tracking-[0.08em] text-rose-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            {t("Black Box: Sim recording", "Black Box: Recording")}
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
        {/* what is being recorded */}
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">Streams recorded today</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BLACKBOX_STREAMS.map((s) => {
              const Icon = STREAM_ICON[s.label] ?? CircleDot;
              return (
                <div key={s.label} className="rounded-md border border-slate-200 bg-slate-100 p-2.5">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-900">
                    <Icon className="h-3.5 w-3.5 text-sky-700" />
                    {s.label}
                  </p>
                  <p className="mt-1 font-tele text-[16px] font-bold leading-none text-slate-900">{s.today}</p>
                  <p className="mt-1 text-[11.5px] uppercase tracking-[0.05em] text-slate-500">{s.cadence}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[12px] font-semibold text-emerald-700">
              <HardDrive className="h-3.5 w-3.5" /> Saved on-site first (works offline)
            </span>
            <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] font-semibold", online ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-100 text-slate-500")}>
              <CloudUpload className="h-3.5 w-3.5" /> Copy to HQ {online ? "· sent 15 min ago" : "· paused — will send by priority"}
            </span>
          </div>
        </div>

        {/* tamper-proof hash chain */}
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">
            <Lock className="h-3.5 w-3.5 text-emerald-700" />
            Tamper-proof record — each entry seals the last
          </p>
          <ol className="mt-2.5 space-y-1.5">
            {BLACKBOX_CHAIN.map((b) => (
              <li key={b.seq} className="rounded border border-slate-200 bg-slate-100 px-2.5 py-1.5">
                <p className="flex flex-wrap items-center gap-x-2 text-[12.5px] font-semibold text-slate-900">
                  <span className="font-tele text-sky-700">#{b.seq}</span>
                  <span className="rounded bg-sky-50 px-1 py-px font-tele text-[10.5px] font-bold uppercase tracking-[0.08em] text-sky-700">{b.type}</span>
                  <span className="font-tele text-slate-500">{b.time}</span>
                  <span className="ml-auto font-mono text-[12px] text-emerald-700">{b.hash}</span>
                </p>
                <p className="mt-0.5 truncate text-[12px] text-slate-500">
                  {b.summary} <span className="font-mono text-[11px] text-slate-500">← prev {b.prev}</span>
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-2.5 flex items-center gap-2">
            <TactButton variant="secondary" onClick={verify} disabled={verifying} icon={<Lock className="h-3.5 w-3.5" />}>
              {verifying ? "Checking…" : "Check the record"}
            </TactButton>
            <span className="text-[12px] uppercase tracking-[0.05em] text-slate-500">1,286 blocks · today</span>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-2">
        <DataSourceTag kind="simulated" label="Demo recorder" />
      </div>
    </Panel>
  );
}

/* ---------------- replay mode (timeline slider) -------------------- */

function ReplayPanel() {
  const [incidentId, setIncidentId] = useState(BLACKBOX_REPLAY[0].id);
  const [tick, setTick] = useState(0);
  const incident: ReplayIncident = BLACKBOX_REPLAY.find((i) => i.id === incidentId) ?? BLACKBOX_REPLAY[0];
  const current = incident.ticks[Math.min(tick, incident.ticks.length - 1)];

  const pick = (id: string) => {
    setIncidentId(id);
    setTick(0);
  };

  return (
    <Panel padded={false} className="overflow-hidden">
      <PanelHeader
        title="View decision replay — drag through any past incident"
        pilot="info"
        right={
          <>
            {/* P2-4 — honest framing: replay never re-executes anything */}
            <span
              title="This will NOT re-execute the action — it only walks through what was recorded, like reading a logbook."
              className="rounded border border-slate-300 bg-slate-50 px-2 py-0.5 font-tele text-[11.5px] font-bold uppercase tracking-[0.06em] text-slate-500"
            >
              Read-only simulation
            </span>
            <DataSourceTag kind="verified" label="From NCPOR incident reviews (demo)" />
          </>
        }
      />
      <div className="space-y-3 p-4">
        {/* incident selector */}
        <div className="flex flex-wrap gap-2">
          {BLACKBOX_REPLAY.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => pick(i.id)}
              className={cn(
                "rounded border px-3 py-1.5 text-left transition-colors",
                i.id === incidentId ? "border-sky-500 bg-sky-100" : "border-slate-300 bg-slate-100 hover:border-sky-400"
              )}
            >
              <span className="block font-tele text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">{i.year} · {i.duration}</span>
              <span className={cn("block text-[13px] font-semibold", i.id === incidentId ? "text-sky-900" : "text-slate-800")}>{i.title}</span>
            </button>
          ))}
        </div>

        {/* timeline slider */}
        <div className="rounded-md border border-slate-200 bg-slate-100 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <Play className="h-3.5 w-3.5 text-sky-700" />
              Decision replay — read-only
            </span>
            <span className="font-tele text-[12.5px] font-bold text-sky-700">{current.t}</span>
          </div>
          <input
            type="range"
            min={0}
            max={incident.ticks.length - 1}
            step={1}
            value={Math.min(tick, incident.ticks.length - 1)}
            onChange={(e) => setTick(Number(e.target.value))}
            aria-label={`Replay position for ${incident.title}`}
            className="mt-2.5 w-full accent-sky-500"
          />
          <div className="mt-1 flex justify-between">
            {incident.ticks.map((t, i) => (
              <button
                key={t.t}
                type="button"
                onClick={() => setTick(i)}
                aria-label={`Jump to ${t.t}`}
                className={cn("h-2.5 w-2.5 rounded-full transition-colors", i === tick ? "bg-sky-500 ring-4 ring-sky-500/25" : i < tick ? "bg-sky-400" : "bg-slate-300")}
              />
            ))}
          </div>

          {/* what was known / decided / outcome */}
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="rounded border border-sky-300/60 bg-sky-50 p-2.5">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-sky-700">What was known</p>
              <p className="mt-1 text-[13px] leading-snug text-slate-800">{current.known}</p>
            </div>
            <div className="rounded border border-amber-300 bg-amber-50 p-2.5">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-amber-700">What was decided</p>
              <p className="mt-1 text-[13px] leading-snug text-slate-800">{current.decided}</p>
            </div>
            <div className="rounded border border-emerald-300 bg-emerald-50 p-2.5">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-emerald-700">What was the outcome</p>
              <p className="mt-1 text-[13px] leading-snug text-slate-800">{current.outcome}</p>
            </div>
          </div>
        </div>

        <p className="text-[12.5px] italic text-slate-500">Lesson learned: {incident.lesson}</p>
      </div>
    </Panel>
  );
}

/* ---------------- what-if mode ------------------------------------- */

function WhatIfPanel() {
  const [sel, setSel] = useState(DECISION_WHATIFS[0].id);
  const wi = DECISION_WHATIFS.find((w) => w.id === sel) ?? DECISION_WHATIFS[0];
  const recordDecision = usePolar((s) => s.recordDecision);

  return (
    <Panel padded={false} className="overflow-hidden">
      <PanelHeader
        title="What-If mode — re-decide a past call"
        pilot="info"
        right={
          <span className="inline-flex items-center gap-1.5 rounded border border-sky-300 bg-sky-50 px-2 py-0.5 font-tele text-[11.5px] font-bold uppercase tracking-[0.08em] text-sky-700">
            AI suggests — humans decide
          </span>
        }
      />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {DECISION_WHATIFS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setSel(w.id)}
              className={cn(
                "max-w-full rounded border px-3 py-1.5 text-left text-[13px] font-semibold transition-colors sm:max-w-[340px]",
                w.id === sel ? "border-sky-500 bg-sky-100 text-sky-900" : "border-slate-300 bg-slate-100 text-slate-800 hover:border-sky-400"
              )}
            >
              <span className="line-clamp-2">{w.title}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-100 p-3">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">What actually happened</p>
            <p className="mt-1 text-[13px] leading-snug text-slate-800">{wi.actual}</p>
            <p className="mt-2.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-sky-700">The alternative</p>
            <p className="mt-1 text-[13px] leading-snug text-slate-800">{wi.alternative}</p>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">Projected outcome</p>
            <ul className="mt-1.5 space-y-1">
              {wi.projection.map((p) => (
                <li key={p} className="flex gap-1.5 text-[13px] leading-snug text-slate-500">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-sky-700" />
                  {p}
                </li>
              ))}
            </ul>
            <p className={cn("mt-2.5 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-tele text-[12px] font-bold uppercase tracking-[0.08em]", VERDICT_STYLE[wi.verdict])}>
              <Scale className="h-3 w-3" />
              Verdict: {wi.verdict}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-slate-500">{wi.verdictNote}</p>
          </div>
        </div>

        <TactButton
          variant="secondary"
          icon={<GitCommitHorizontal className="h-3.5 w-3.5" />}
          onClick={() => {
            recordDecision({
              id: `DEC-WI-${wi.id.toUpperCase()}`,
              date: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
              title: `What-if review — ${wi.title}`,
              domain: "Planning",
              decision: `Replay review of the alternative "${wi.alternative}". Simulated verdict: ${wi.verdict}. ${wi.verdictNote}`,
              context: {
                weather: "Retrospective replay — no live operations affected",
                assets: "Historic posture rebuilt from the Black Box record",
                trigger: "What-If mode on the Black Box",
              },
              approvals: [{ name: "Cmdr. V. Vance", role: "Station Leader", action: "Reviewed alternative outcome" }],
              versions: [{ v: "v1.0", who: "Cmdr. V. Vance", change: "What-if review logged", time: "just now" }],
              retention: "ACTIVE",
              status: "APPROVED",
              replay: [`What-if: ${wi.title} → ${wi.verdict}`],
            });
            toast.success("Review saved to Past decisions — the team’s memory grows with every replay.", { duration: 4500 });
          }}
        >
          Save this review to Past decisions
        </TactButton>
      </div>
    </Panel>
  );
}

/* ---------------- decision log (searchable) ------------------------ */

function DecisionLogPanel() {
  const logged = usePolar((s) => s.loggedDecisions);
  const setView = usePolar((s) => s.setView);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(false);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = logged.map((d) => ({ id: d.id, date: d.date, title: d.title, who: d.approvals[0]?.name ?? "—", what: d.decision, session: true as const }));
    if (!needle) return base.slice(0, expanded ? base.length : 3);
    return base.filter((d) => `${d.id} ${d.title} ${d.what} ${d.who}`.toLowerCase().includes(needle));
  }, [q, logged, expanded]);

  return (
    <Panel padded={false} className="overflow-hidden">
      <PanelHeader
        title="Decision log — who, what, when, why, approved by"
        right={
          <button type="button" onClick={() => setView("decisions")} className="text-[12.5px] font-semibold text-sky-700 hover:underline">
            Open all past decisions →
          </button>
        }
      />
      <div className="space-y-2.5 p-4">
        <div className="flex h-9 items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search decisions — e.g. "reroute", "CG-131", "whiteout"…'
            aria-label="Search the decision log"
            className="w-full bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-500"
          />
        </div>
        {hits.length === 0 ? (
          <p className="text-[13px] text-slate-500">No decisions match "{q}". Decisions made this session appear here instantly and are archived — never deleted.</p>
        ) : (
          <ul className="space-y-2">
            {hits.map((d) => (
              <li key={d.id} className="rounded-md border border-slate-200 bg-slate-100 p-3">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-tele text-[12px] font-bold text-sky-700">{d.id}</span>
                  <span className="text-[13px] font-semibold text-slate-900">{d.title}</span>
                  {d.session && (
                    <span className="rounded bg-sky-50 px-1.5 py-px font-tele text-[10.5px] font-bold uppercase tracking-[0.08em] text-sky-700">This session</span>
                  )}
                </p>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-slate-500">{d.what}</p>
                <p className="mt-1 font-tele text-[12px] uppercase tracking-[0.05em] text-slate-500">
                  {d.date} · by {d.who}
                </p>
              </li>
            ))}
          </ul>
        )}
        {!q && logged.length > 3 && (
          <button type="button" onClick={() => setExpanded((o) => !o)} className="mt-1">
            <ViewMoreHint open={expanded} label={`Show all ${logged.length} session decisions`} />
          </button>
        )}
      </div>
    </Panel>
  );
}

/* ---------------- the view ------------------------------------------ */

export function BlackBoxView() {
  return (
    <div className="space-y-4">
      <PageHeader
        kicker="What happened and what did we learn?"
        title="Black Box Recorder"
        sub="Like an airplane’s black box: every position, message, decision, alert, approval and weather reading is written down as it happens, and each entry is sealed to the previous one so nothing can be quietly changed. Replay past incidents minute-by-minute, or try “what if we had decided differently?”."
        right={
          <span className="inline-flex items-center gap-2 rounded border border-rose-300 bg-rose-50 px-3 py-1.5 font-tele text-[12px] font-bold uppercase tracking-[0.08em] text-rose-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            {t("Black Box: Sim recording", "Black Box: Recording")}
          </span>
        }
      />

      <div className="space-y-4">
        <RecorderPanel />
        <ReplayPanel />
        <WhatIfPanel />
        <DecisionLogPanel />
      </div>
    </div>
  );
}
