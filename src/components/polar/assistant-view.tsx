"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BrainCircuit,
  Play,
  TerminalSquare,
  CircleCheck,
  XCircle,
  PauseCircle,
  User as UserIcon,
  SatelliteDish,
  Radar as RadarIcon,
  ArrowRight,
  Loader2,
  Cpu,
  CloudSun,
  Route as RouteIcon,
} from "lucide-react";
import { SUGGESTED_QUESTIONS } from "@/lib/polar-data";
import { usePolar, type ChatMessage } from "@/lib/polar-store";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { FailedAction } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader, PrototypeTag, PriorityChip, TactButton } from "./ui-bits";

/* per-answer confidence + reasoning column labels */
const ANSWER_META: Record<string, { conf: string; labels: string[] }> = {
  "q-exp-attention": { conf: "96.4%", labels: ["Check-in records", "Weather", "Risk patterns"] },
  "q-support-ant09": { conf: "95.1%", labels: ["Rescue readiness", "Fuel state", "Equipment"] },
  "q-resupply-when": { conf: "94.1%", labels: ["Usage model", "Alert lines", "Transfer plan"] },
  "q-atv-flagged": { conf: "92.8%", labels: ["Service history", "Sensor trends", "Risk pattern"] },
  "q-attention": { conf: "96.4%", labels: ["Supplies", "Equipment health", "Weather"] },
  "q-supplies": { conf: "94.1%", labels: ["CONSUMPTION MODEL", "THRESHOLD MARGIN", "FLEET DRAW"] },
  "q-assets": { conf: "92.8%", labels: ["Sensor data", "Service history", "Failure patterns"] },
  "q-alerts": { conf: "97.2%", labels: ["How urgent", "Timeline", "Who is affected"] },
  "q-commander": { conf: "90.6%", labels: ["Risk patterns", "Backup options", "Weather"] },
  "q-weather": { conf: "95.3%", labels: ["Wind model", "Visibility", "Trend"] },
  "q-emergency": { conf: "91.9%", labels: ["Emergency plan", "Rescue readiness", "Timeline"] },
  "q-fallback": { conf: "88.0%", labels: ["General scan", "Signals", "Trend"] },
};

const PRESET_META = [
  { conf: "96.4%", meta: "Top priority", tone: "border-sky-300 bg-sky-50" },
  { conf: "95.1%", meta: "Rescue support", tone: "border-amber-200 bg-amber-50" },
  { conf: "94.1%", meta: "Food plan", tone: "border-slate-200 bg-white" },
  { conf: "92.8%", meta: "Life support", tone: "border-slate-200 bg-white" },
  { conf: "95.3%", meta: "Weather outlook", tone: "border-slate-200 bg-white" },
  { conf: "97.2%", meta: "Situation report", tone: "border-slate-200 bg-white" },
];

const CONSTRAINTS = ["Play it safe (careful risk margins)", "Handle extreme wind (+50 kt)", "Keep rescue-flight fuel in reserve"];

/* P2-3 — who a recommendation can be assigned to */
const ASSIGNEES = ["Dr. Arjun Mehta (ANT-07 lead)", "Dr. Vikram Roy (ANT-09 lead)", "S. Iyer (Logistics Officer)", "Medic team · Maitri"];

type DecisionMode = "ACCEPT" | "REJECT" | "DEFER" | "ASSIGN";

const SYNC = [
  { name: "Sentinel-1D satellite radar", status: "next pass in 14 min", tone: "text-slate-600" },
  { name: "IMD weather satellite", status: "not connected yet", tone: "text-amber-700 font-bold" },
  { name: "Crevasse sensors (demo)", status: "3 of 4 reporting", tone: "text-amber-700 font-bold" },
];

/* ------------------------------------------------------------------ */
/* synthesis answer card                                               */
/* ------------------------------------------------------------------ */

function SynthesisCard({ m, query, index }: { m: ChatMessage; query?: string; index: number }) {
  const setView = usePolar((s) => s.setView);
  const openExpedition = usePolar((s) => s.openExpedition);
  const openAsset = usePolar((s) => s.openAsset);
  const recordDecision = usePolar((s) => s.recordDecision);
  /* stable pseudo-confidence from verdict content */
  const hash = Math.abs((m.verdict ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 7;
  const meta = Object.values(ANSWER_META)[hash % 4] ?? ANSWER_META["q-fallback"];
  /* P0-3 — accepting an AI recommendation is high-consequence: confirm + reason */
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  /* P1-2 — reasoning hidden behind View details */
  const [showDetails, setShowDetails] = useState(false);
  /* P2-3 — approval lifecycle */
  const [decisionMode, setDecisionMode] = useState<DecisionMode | null>(null);
  const [assignee, setAssignee] = useState(ASSIGNEES[0]);
  const firstAction = (m.actions ?? [])[0];
  /* P2-7 — designed failure state for the brief download */
  const [briefFailed, setBriefFailed] = useState(false);

  const logDecision = (mode: DecisionMode, reason: string) => {
    const decisionText =
      mode === "ACCEPT" ? `Accepted AI suggestion: ${firstAction ?? m.verdict}`
      : mode === "REJECT" ? `Rejected AI suggestion: ${m.verdict}`
      : mode === "DEFER" ? `Deferred AI suggestion until ${reason || "the next planning cycle"}`
      : `Assigned AI suggestion to ${assignee}`;
    recordDecision({
      id: `DEC-AI-${4409 + index}-${mode.toLowerCase()}`,
      date: "Just now · from AI Assistant",
      title: decisionMode === "ACCEPT" && confirmAction ? confirmAction : firstAction ?? m.verdict,
      domain: "Planning",
      decision: decisionText,
      context: {
        weather: "See linked answer",
        assets: "See linked answer",
        trigger: query ? `AI question: “${query}”` : "AI Assistant recommendation",
      },
      approvals: [{ name: "Cmdr. V. Vance", role: "Station Leader · Ops", action: mode.charAt(0) + mode.slice(1).toLowerCase() }],
      versions: [{ v: "v1.0", who: "Cmdr. V. Vance", change: `${mode} recorded via confirmation dialog${reason ? ` — “${reason}”` : ""}`, time: "just now" }],
      retention: "ACTIVE",
      replay: ["AI suggested — human decided", decisionText],
      status: mode === "ACCEPT" ? "APPROVED" : "PROPOSED",
    });
    toast.success(`Decision logged: ${mode.charAt(0) + mode.slice(1).toLowerCase()} — the system did not act by itself (demo)`, { duration: 4500 });
  };

  const goLink = () => {
    if (!m.link) return;
    if (m.link.assetId) openAsset(m.link.assetId);
    else if (m.link.expeditionId) openExpedition(m.link.expeditionId);
    else setView(m.link.view);
  };

  return (
    <div data-tour="ai-answer" className={cn("px-fadeup overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]", index === 0 && "")}>
      {/* session header */}
      <div className="rail flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3.5 py-2">
        <span className="flex items-center gap-2 font-tele text-label-micro font-bold uppercase tracking-wider text-slate-600">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Answer #{String(4409 + index)}
        </span>
        <span className="font-tele text-label-micro uppercase tracking-wider text-slate-600">
          from the demo dataset
        </span>
      </div>

      <div className="p-3.5">
        <p className="border-l-2 border-sky-500 pl-3 font-display text-body-lg font-semibold leading-snug text-slate-900">
          “{query ?? "Your question"}”
        </p>

        {/* metrics row — P0-4: demo-framed, never authoritative */}
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="well px-2.5 py-2">
            <div className="text-[12px] text-slate-500">Demo score</div>
            <div className="font-tele text-[20px] font-bold text-sky-700">{meta.conf}</div>
            <div className="text-[11.5px] font-medium text-amber-700">not calibrated</div>
          </div>
          <div className="well px-2.5 py-2">
            <div className="text-[12px] text-slate-500">Engine</div>
            <div className="font-tele text-telemetry-sm font-bold text-slate-900">PX Polar-Opt v2.6</div>
            <div className="text-[11.5px] font-medium text-slate-500">simulated reasoning</div>
          </div>
          <div className="well px-2.5 py-2">
            <div className="text-[12px] text-slate-500">Simulation check</div>
            <div className="text-[12.5px] font-bold text-emerald-700">Passed (demo)</div>
          </div>
          <div className="well px-2.5 py-2">
            <div className="text-[12px] text-slate-500">Demo model</div>
            <div className="text-[12.5px] font-bold text-slate-900">Aligned (demo)</div>
          </div>
        </div>

        {/* verdict */}
        <div className="mt-3 rounded-sm border border-sky-200 bg-sky-50/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-sky-800">The answer</span>
            {m.priority && <PriorityChip level={m.priority} />}
          </div>
          <p className="mt-1.5 font-display text-headline-sm leading-snug text-slate-900">{m.verdict}</p>
        </div>

        {/* reasoning columns — P1-2: 2-column, hidden behind "View details" by default */}
        <div className="mt-3">
          <button
            data-tour="ai-details"
            type="button"
            onClick={() => setShowDetails((o) => !o)}
            aria-expanded={showDetails}
            className="flex w-full items-center justify-between gap-2 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-sky-400"
          >
            <span className="flex items-center gap-2 font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">
              <BrainCircuit className="h-4 w-4 text-sky-600" />
              Why the system says this (simulated reasoning)
            </span>
            <span className="text-[12.5px] font-bold text-sky-700">{showDetails ? "Hide details" : "View details"}</span>
          </button>
          {showDetails && (
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {(m.reasons ?? []).slice(0, 3).map((r, i) => (
                <div key={i} className="rounded-sm border border-slate-200 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-tele text-label-micro font-bold uppercase tracking-wider text-sky-700">
                      {String(i + 1).padStart(2, "0")} · {meta.labels[i] ?? "ANALYSIS"}
                    </span>
                    {i === 0 && <CloudSun className="h-3.5 w-3.5 text-slate-600" />}
                    {i === 1 && <RouteIcon className="h-3.5 w-3.5 text-slate-600" />}
                    {i === 2 && <Cpu className="h-3.5 w-3.5 text-slate-600" />}
                  </div>
                  <p className="mt-1.5 text-body-sm leading-relaxed text-slate-700">{r}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* actions — each one is clickable and goes through a confirmation (P0-3) */}
        <div className="mt-3 rounded-sm border border-slate-200 p-3">
          <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">Suggested next steps — tap one to act on it</span>
          <div className="mt-2 grid grid-cols-1 gap-1.5 md:grid-cols-3">
            {(m.actions ?? []).map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setConfirmAction(a)}
                className="flex items-start gap-2 rounded-sm bg-slate-50 px-2.5 py-2 text-left text-body-sm text-slate-700 transition-colors hover:border-sky-400 hover:bg-sky-50 border border-transparent"
              >
                <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* P0-3 — human-in-the-loop confirmation with reason */}
        <ConfirmationModal
          open={confirmAction !== null}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (!confirmAction) return;
            recordDecision({
              id: `DEC-AI-${4409 + index}-${confirmAction.length}`,
              date: "Just now · from AI Assistant",
              title: confirmAction,
              domain: "Planning",
              decision: `Accepted AI suggestion: ${confirmAction}`,
              context: {
                weather: "See linked answer",
                assets: "See linked answer",
                trigger: query ? `AI question: “${query}”` : "AI Assistant suggestion",
              },
              approvals: [{ name: "Cmdr. V. Vance", role: "Station Leader · Ops", action: "Accepted recommendation" }],
              versions: [{ v: "v1.0", who: "Cmdr. V. Vance", change: "Recommendation accepted via confirmation dialog", time: "just now" }],
              retention: "ACTIVE",
              replay: ["AI suggested — human decided", confirmAction],
              status: "APPROVED",
            });
            toast.success("Decision recorded in the Decision Log — nothing was auto-executed (demo)", { duration: 4500 });
          }}
          action={confirmAction ?? ""}
          target={m.link?.expeditionId ? `EXP-411 · ${m.link.expeditionId.toUpperCase()}` : "Current operation"}
          priority={m.priority ?? "MEDIUM"}
          consequence="Decision + reason are recorded in the Decision Log — the system never acts by itself"
          isSimulated
          approver="Cmdr. V. Vance"
          confirmLabel="Confirm & Record Decision"
          requireReason
        />

        {/* footer actions — P2-3: full approval lifecycle, every decision logged */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <PrototypeTag />
          <div className="flex flex-wrap items-center gap-2">
            {m.link && (
              <TactButton onClick={goLink}>
                {m.link.label} <ArrowRight className="h-3.5 w-3.5" />
              </TactButton>
            )}
            <TactButton variant="secondary" onClick={() => setBriefFailed(true)}>
              Download brief
            </TactButton>
            <TactButton variant="secondary" onClick={() => toast.success("Route update sent to the field teams (demo)")}>
              Send to teams
            </TactButton>
          </div>
        </div>

        {/* P2-3 — Accept / Reject / Defer / Assign */}
        <div data-tour="ai-decide" className="mt-3 flex flex-wrap items-center gap-2 rounded-sm border border-slate-200 bg-slate-50 p-2.5">
          <span className="font-tele text-label-micro font-bold uppercase tracking-[0.1em] text-slate-500">
            Your decision (logged either way):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDecisionMode("ACCEPT")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-700 transition-colors hover:border-emerald-500"
            >
              <CircleCheck className="h-4 w-4" /> Accept
            </button>
            <button
              type="button"
              onClick={() => setDecisionMode("REJECT")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-3 py-1.5 text-[13px] font-bold text-rose-700 transition-colors hover:border-rose-500"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button
              type="button"
              onClick={() => setDecisionMode("DEFER")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-[13px] font-bold text-amber-800 transition-colors hover:border-amber-500"
            >
              <PauseCircle className="h-4 w-4" /> Defer
            </button>
            <span className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2 py-1">
              <UserIcon className="h-4 w-4 text-slate-500" />
              <select
                aria-label="Assign this recommendation to"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="bg-transparent text-[13px] font-semibold text-slate-700 outline-none"
              >
                {ASSIGNEES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setDecisionMode("ASSIGN")}
                className="rounded border border-sky-300 bg-sky-50 px-2.5 py-1 text-[13px] font-bold text-sky-700 transition-colors hover:border-sky-500"
              >
                Assign
              </button>
            </span>
          </div>
        </div>

        {/* P2-7 — designed failure + retry (demo: first attempt fails) */}
        {briefFailed && (
          <FailedAction
            what="the brief download failed"
            onRetry={() => {
              setBriefFailed(false);
              toast.success("Brief downloaded on retry — PX-BRIEF-" + (4409 + index) + ".pdf (demo)");
            }}
            onDismiss={() => setBriefFailed(false)}
          />
        )}

        {/* decision confirmation — records to the Decision Log with reason */}
        <ConfirmationModal
          open={decisionMode !== null}
          onClose={() => setDecisionMode(null)}
          onConfirm={(reason) => {
            if (!decisionMode) return;
            logDecision(decisionMode, reason);
            setDecisionMode(null);
          }}
          action={
            decisionMode === "ACCEPT" ? `Accept AI recommendation: ${firstAction ?? m.verdict}`
            : decisionMode === "REJECT" ? `Reject AI recommendation: ${m.verdict}`
            : decisionMode === "DEFER" ? `Defer AI recommendation: ${m.verdict}`
            : `Assign AI recommendation to ${assignee}`
          }
          target={m.link?.expeditionId ? `EXP-411 · ${m.link.expeditionId.toUpperCase()}` : "Current operation"}
          priority={m.priority ?? "MEDIUM"}
          consequence="Decision + reason are recorded in the Decision Log — the system never acts by itself"
          isSimulated
          approver="Cmdr. V. Vance"
          confirmLabel={
            decisionMode === "ACCEPT" ? "Confirm & Record Decision"
            : decisionMode === "REJECT" ? "Confirm & Reject"
            : decisionMode === "DEFER" ? "Confirm & Defer"
            : "Confirm & Assign"
          }
          requireReason
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* main view                                                           */
/* ------------------------------------------------------------------ */

export function AssistantView() {
  const chat = usePolar((s) => s.chat);
  const typing = usePolar((s) => s.assistantTyping);
  const askAssistant = usePolar((s) => s.askAssistant);
  const [input, setInput] = useState("");
  const [constraints, setConstraints] = useState<boolean[]>([true, true, false]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.length, typing]);

  const submit = (q: string) => {
    const text = q.trim();
    if (!text) return;
    askAssistant(text);
    setInput("");
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <Panel padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-sky-200 bg-sky-50">
              <BrainCircuit className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h1 className="font-display text-headline-md text-slate-900">AI Assistant</h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-sm border border-sky-300 bg-sky-100 px-2 py-0.5 text-[12px] font-semibold text-sky-800">Rule-based demo brain</span>
                <span className="rounded-sm border border-slate-200 bg-white px-2 py-0.5 text-[12px] font-medium text-slate-600">Answers in seconds</span>
                <span className="font-tele text-body-sm text-slate-600">
                  It reads the mission data with fixed rules and suggests answers — no external AI service
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { icon: Cpu, k: "Rule engine", v: "Working" },
              { icon: CloudSun, k: "Weather model", v: "Ready" },
              { icon: RouteIcon, k: "Route checker", v: "Active" },
            ].map((t) => (
              <div key={t.k} className="rounded-sm border border-slate-200 bg-white px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 font-tele text-label-micro uppercase tracking-wider text-slate-500">
                  <t.icon className="h-3 w-3" />{t.k}
                </div>
                <div className="font-tele text-telemetry-sm font-bold text-sky-700">{t.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-3.5 py-1.5">
          <PrototypeTag className="bg-white">All answers come from the SIH 2026 demo dataset</PrototypeTag>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* left rail */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          {/* query directory */}
          <Panel padded={false} className="overflow-hidden">
            <PanelHeader index="SEC.01" title="Try asking" right={<span className="text-[12px] text-slate-500">6 ready questions</span>} />
            <div className="space-y-2 p-3">
              {SUGGESTED_QUESTIONS.map((q, i) => {
                const pm = PRESET_META[i % PRESET_META.length];
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => submit(q)}
                    className={cn(
                      "block w-full rounded-sm border p-2.5 text-left transition-all hover:border-sky-500",
                      pm.tone,
                      i === 0 && "border-sky-400 ring-1 ring-sky-200"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-tele text-label-micro font-bold uppercase tracking-wider text-slate-600">
                        SIM-QRY-{String(i + 1).padStart(3, "0")} · {pm.meta}
                      </span>
                      <Play className="h-3 w-3 shrink-0 text-sky-600" />
                    </div>
                    <p className="mt-1 text-body-sm font-medium leading-snug text-slate-800">{q}</p>
                    <div className="mt-1.5 flex items-center justify-between font-tele text-label-micro uppercase tracking-wider text-slate-500">
                      <span>Demo answers</span>
                      <span className="font-bold text-sky-700">Demo score: {pm.conf}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* neural terminal */}
          <Panel padded={false} className="overflow-hidden">
            <PanelHeader
              index="SEC.02"
              title="Ask your own question"
              right={<span className="font-tele text-label-micro font-bold uppercase text-emerald-700">READY</span>}
            />
            <div className="p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(input);
                }}
                className="well p-2.5"
              >
                <label htmlFor="px-terminal" className="font-tele text-telemetry-sm font-semibold text-emerald-700">
                  Your question:
                </label>
                <textarea
                  id="px-terminal"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(input);
                    }
                  }}
                  rows={3}
                  placeholder="Type your question and press Enter…"
                  className="mt-1.5 w-full resize-none rounded-sm border border-slate-300 bg-white p-2 font-tele text-body-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </form>
              <TactButton className="mt-2 w-full py-2" onClick={() => submit(input)}>
                <TerminalSquare className="h-3.5 w-3.5" /> Get the answer
              </TactButton>

              {/* constraints */}
              <div className="mt-3">
                <span className="text-[12px] font-semibold text-slate-500">The answer must respect:</span>
                <div className="mt-1.5 space-y-1">
                  {CONSTRAINTS.map((c, i) => (
                    <label key={c} className="flex cursor-pointer items-center justify-between gap-2 rounded-sm border border-slate-200 px-2.5 py-1.5 transition-colors hover:border-sky-400">
                      <span className="flex items-center gap-2 text-body-sm text-slate-700">
                        <span className={cn("h-1.5 w-1.5 rounded-full", constraints[i] ? "bg-sky-500" : "bg-slate-300")} />
                        {c}
                      </span>
                      <input
                        type="checkbox"
                        checked={constraints[i]}
                        onChange={(e) => {
                          const next = [...constraints];
                          next[i] = e.target.checked;
                          setConstraints(next);
                          toast.success(`Updated: ${c} — ${e.target.checked ? "on" : "off"}`);
                        }}
                        className="h-3.5 w-3.5 accent-sky-600"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* radar sync */}
          <Panel padded={false} className="overflow-hidden">
            <PanelHeader index="SEC.03" title="Data being used" />
            <div className="divide-y divide-slate-100">
              {SYNC.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="flex items-center gap-2 text-body-sm text-slate-700">
                    <SatelliteDish className="h-3.5 w-3.5 text-slate-600" />
                    {s.name}
                  </span>
                  <span className={cn("font-tele text-label-micro uppercase tracking-wider", s.tone)}>{s.status}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* right — synthesis session */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          {chat.length === 0 && !typing && (
            <Panel className="flex min-h-[280px] flex-col items-center justify-center bg-gradient-to-br from-sky-50/70 to-white text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-200 bg-white">
                <BrainCircuit className="h-7 w-7 text-sky-600" />
              </div>
              <h2 className="mt-3 font-display text-headline-sm font-semibold text-slate-900">Ask a question to see the answer here</h2>
              <p className="mt-1 max-w-md text-body-sm leading-relaxed text-slate-600">
                Pick a ready-made question on the left, or type your own. The assistant reads plans, supplies, equipment and weather — then suggests next steps a person can approve.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => submit(q)}
                    className="rounded-full border border-sky-300 bg-white px-3.5 py-1.5 text-body-sm font-medium text-sky-700 transition-colors hover:bg-sky-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {chat.map((m, i) =>
            m.role === "assistant" ? (
              <SynthesisCard key={m.id} m={m} query={chat[i - 1]?.role === "user" ? chat[i - 1].text : undefined} index={i} />
            ) : (
              <div key={m.id} className="flex justify-end">
                <span className="max-w-md rounded-sm rounded-br-none border border-slate-200 bg-slate-100 px-3 py-2 text-body-sm text-slate-800">
                  {m.text}
                </span>
              </div>
            )
          )}

          {typing && (
            <div className="flex items-center gap-2.5 rounded-sm border border-sky-200 bg-sky-50/70 px-3.5 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
              <span className="font-tele text-label-caps font-semibold uppercase tracking-wider text-sky-800">
                Thinking — checking supplies, equipment and weather…
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
