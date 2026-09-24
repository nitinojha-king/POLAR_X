"use client";

import { useEffect, useState } from "react";
import {
  X,
  Zap,
  MoveRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { usePolar } from "@/lib/polar-store";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/utils";
import { CASCADE_SCENARIOS, type CascadeScenario, type CascadeNode } from "@/lib/polar-data";
import { DataSourceTag, TactButton } from "./ui-bits";

/* ==================================================================
   FEATURE 7 — CASCADE SIMULATOR (spec: "What if X fails?")
   Evidence: report §6 — Halley VI coolant-leak cascade.
   Output is ALWAYS a rehearsal: AI suggests, humans decide, nothing
   is auto-executed — every choice is logged to the Black Box.
   ================================================================== */

const NODE_STATE: Record<CascadeNode["state"], { chip: string; label: string }> = {
  STOPS: { chip: "border-rose-300 bg-rose-50 text-rose-700", label: "STOPS" },
  DOWN: { chip: "border-rose-300 bg-rose-50 text-rose-700", label: "DOWN" },
  HALTED: { chip: "border-rose-300 bg-rose-50 text-rose-700", label: "HALTED" },
  "AT RISK": { chip: "border-amber-300 bg-amber-50 text-amber-700", label: "AT RISK" },
};

/* ---------------- dependency graph (cascading red arrows) --------- */

function DependencyGraph({ scenario }: { scenario: CascadeScenario }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-100 p-3.5">
      {/* root node */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-rose-50 ring-1 ring-rose-300">
          <Zap className="h-4 w-4 text-rose-700" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-bold tracking-[-0.01em] text-slate-900">{scenario.root}</p>
          <p className="truncate text-[12.5px] text-slate-500">{scenario.rootNote}</p>
        </div>
        <span className="ml-auto shrink-0 rounded bg-rose-500 px-1.5 py-0.5 font-tele text-[11px] font-bold uppercase tracking-[0.08em] text-white">
          T + 0h
        </span>
      </div>

      {/* cascade branches */}
      <ul className="ml-4 mt-1 space-y-0 border-l-2 border-rose-300/60 pl-0">
        {scenario.nodes.map((n, i) => {
          const st = NODE_STATE[n.state];
          return (
            <li key={n.label} className="relative pb-2.5 pl-6 pt-2.5 last:pb-0">
              {/* branch connector + red arrow */}
              <span className="absolute left-0 top-6 h-0.5 w-6 bg-rose-300/60" aria-hidden />
              <MoveRight className="absolute left-4 top-[19px] h-3.5 w-3.5 text-rose-700" aria-hidden />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[13.5px] font-semibold text-slate-900">{n.label}</span>
                <span className={cn("rounded border px-1.5 py-px font-tele text-[11px] font-bold uppercase tracking-[0.08em]", st.chip)}>
                  {st.label}
                </span>
                <span className="font-tele text-[11.5px] font-semibold uppercase tracking-[0.05em] text-slate-500">{n.eta}</span>
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">└─► {n.impact}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- mitigation panel -------------------------------- */

function MitigationPanel({ scenario }: { scenario: CascadeScenario }) {
  return (
    <div className="rounded-md border border-slate-200 p-3.5">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
        What we have ready
      </p>
      <ul className="mt-2.5 space-y-2">
        {scenario.mitigations.map((m) => (
          <li key={m.label} className="flex items-start gap-2.5">
            {m.ok === true ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            ) : m.ok === false ? (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900">
                {m.label}:{" "}
                <span className={m.ok === true ? "text-emerald-700" : m.ok === false ? "text-rose-700" : "text-amber-700"}>
                  {m.ok === true ? "Ready" : m.ok === false ? "Not ready" : "Partly"}
                </span>
              </p>
              <p className="text-[12.5px] leading-snug text-slate-500">{m.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- alternatives ------------------------------------ */

function AlternativesPanel({ scenario }: { scenario: CascadeScenario }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-sky-300 bg-sky-50 p-3.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-sky-700">
          <GitBranch className="h-3.5 w-3.5" />
          See alternatives — other ways to respond
        </span>
        <ChevronDown className={cn("h-4 w-4 text-sky-700 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-2.5 space-y-2">
          {scenario.alternatives.map((a) => (
            <li key={a.title} className="rounded border border-sky-300/60 bg-slate-100 p-2.5">
              <p className="text-[13px] font-semibold text-slate-900">{a.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{a.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- the modal ---------------------------------------- */

export function CascadeModal({
  open,
  scenario,
  onClose,
  onSwitch,
}: {
  open: boolean;
  scenario: CascadeScenario;
  onClose: () => void;
  onSwitch: (id: string) => void;
}) {
  const recordDecision = usePolar((s) => s.recordDecision);
  const [decision, setDecision] = useState<"EVACUATE" | "REPAIR" | null>(null);
  /* STEP 13 — focus trap */
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  /* NOTE: the rehearsal decision resets on scenario change / reopen via the
     remount key applied by <CascadeStrip> — no effect needed. */

  /* Escape closes */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const choose = (choice: "EVACUATE" | "REPAIR") => {
    setDecision(choice);
    recordDecision({
      id: `DEC-SIM-${scenario.id.toUpperCase()}`,
      date: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      title: `Practice run — ${scenario.root} → ${choice}`,
      domain: "Emergency",
      decision: `Practice only: if ${scenario.name.toLowerCase()} failed, the recorded human choice was ${choice}. Nothing was switched off and no order was sent — POLAR-X never acts on its own.`,
      context: {
        weather: "Simulated failure injected in the Cascade Simulator",
        assets: scenario.mitigations.map((m) => `${m.label}: ${m.ok === true ? "available" : m.ok === false ? "missing" : "partial"}`).join(" · "),
        trigger: `What-if rehearsal — ${scenario.evidence}`,
      },
      approvals: [{ name: "Cmdr. V. Vance", role: "Station Leader", action: `Chose ${choice} in rehearsal` }],
      versions: [{ v: "v1.0", who: "Cmdr. V. Vance", change: "Rehearsal decision recorded", time: "just now" }],
      retention: "ACTIVE",
      status: "APPROVED",
      replay: [`Rehearsal: ${scenario.root} → human chose ${choice}`],
    });
    toast.success(`Practice choice saved to the Black Box — ${choice}. Nothing was actually done.`, { duration: 5000 });
  };

  return (
    <div ref={trapRef} className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 md:items-center" role="dialog" aria-modal aria-label="Failure simulator">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_-16px_rgba(15,23,42,0.25)]">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-rose-700">
              <ShieldAlert className="h-3.5 w-3.5" />
              Failure simulator · practice only
            </p>
            <h2 className="mt-0.5 truncate text-[16px] font-bold tracking-[-0.01em] text-slate-900">What if {scenario.name.toLowerCase()} fails?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close simulator"
            className="rounded border border-slate-200 bg-slate-100 p-1.5 text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[72vh] space-y-3 overflow-y-auto p-4">
          <DependencyGraph scenario={scenario} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MitigationPanel scenario={scenario} />

            {/* human decision — never auto-executed */}
            <div className="flex flex-col gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3.5">
              <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Human decision required
              </p>
              <p className="text-[12.5px] leading-snug text-slate-500">
                The system suggests <span className="font-semibold text-slate-900">{decision ? "nothing further" : "evacuating if the batteries can’t cover the repairs"}</span> — but
                only a person decides. Nothing here happens automatically.
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => choose("EVACUATE")}
                  className={cn(
                    "rounded border px-3 py-1.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors",
                    decision === "EVACUATE"
                      ? "border-rose-400 bg-rose-500 text-white"
                      : "border-rose-300 bg-transparent text-rose-700 hover:border-rose-400"
                  )}
                >
                  Evacuate
                </button>
                <button
                  type="button"
                  onClick={() => choose("REPAIR")}
                  className={cn(
                    "rounded border px-3 py-1.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors",
                    decision === "REPAIR"
                      ? "border-sky-500 bg-sky-600 text-white"
                      : "border-sky-300 bg-transparent text-sky-700 hover:border-sky-400"
                  )}
                >
                  Repair
                </button>
              </div>
              {decision && (
                <p className="flex items-start gap-1.5 text-[12.5px] leading-snug text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {decision} recorded · signed by Cmdr. V. Vance · saved to the Black Box and Past decisions.
                </p>
              )}
            </div>
          </div>

          <AlternativesPanel scenario={scenario} />

          {/* alternative-scenario quick switch */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 p-3">
            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Try another failure:</span>
            {CASCADE_SCENARIOS.filter((s) => s.id !== scenario.id).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSwitch(s.id)}
                className="rounded border border-slate-300 bg-slate-100 px-2.5 py-1 text-[12.5px] font-semibold text-slate-800 transition-colors hover:border-sky-400 hover:text-white"
              >
                {s.name} <ChevronRight className="mb-0.5 inline h-3 w-3" />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
            <p className="text-[12px] italic text-slate-500">Why we practice this: {scenario.evidence}</p>
            <DataSourceTag kind="simulated" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- home-page strip (per spec mockup) ---------------- */

export function CascadeStrip() {
  const [selected, setSelected] = useState(CASCADE_SCENARIOS[0].id);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const scenario = CASCADE_SCENARIOS.find((s) => s.id === (activeId ?? selected)) ?? CASCADE_SCENARIOS[0];

  return (
    <>
      <div className="panel flex flex-col gap-2.5 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-rose-50 ring-1 ring-rose-300">
            <GitBranch className="h-4 w-4 text-rose-700" />
          </span>
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold tracking-[-0.01em] text-slate-900">Failure Simulator</p>
            <p className="truncate text-[13px] text-slate-500">Pick a critical piece of equipment and rehearse what fails next — before it happens for real.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              aria-label="Select a component to simulate"
              className="h-9 appearance-none rounded border border-slate-300 bg-slate-100 py-0 pl-3 pr-8 text-[13px] font-semibold text-slate-800 outline-none transition-colors hover:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/60"
            >
              {CASCADE_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
          <TactButton variant="danger" onClick={() => setOpen(true)} icon={<Zap className="h-3.5 w-3.5" />}>
            Run the simulation
          </TactButton>
        </div>
      </div>

      <CascadeModal
        key={open ? `open-${scenario.id}` : "closed"}
        open={open}
        scenario={scenario}
        onClose={() => setOpen(false)}
        onSwitch={(id) => {
          setSelected(id);
          setActiveId(id);
        }}
      />
    </>
  );
}
