"use client";

/**
 * Guided demo — an 8-step judge walkthrough (driver.js-style, but
 * dependency-free). Started from the Simulation Mode strip.
 * Each step navigates, highlights the relevant element, and explains
 * what the judge should notice. Nothing is ever executed — the tour
 * only reads what is already on screen.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePolar } from "@/lib/polar-store";
import { SUGGESTED_QUESTIONS, type View } from "@/lib/polar-data";
import { cn } from "@/lib/utils";

interface TourStep {
  view: View;
  setup?: "ask" | (() => void);
  selector?: string;
  title: string;
  text: string;
}

const STEPS: TourStep[] = [
  {
    view: "command",
    selector: '[data-tour="rec-action"]',
    title: "1 · One calm screen — the recommended next action",
    text: "Mission Overview answers “is the expedition on track?” in one glance: a readiness score, ONE suggested next action with its owner and data age, and only the items that truly need a decision.",
  },
  {
    view: "expeditions",
    setup: undefined, // replaced at runtime with openExpedition("ant-09")
    selector: '[data-tour="exp-detail"]',
    title: "2 · Open the flagged expedition — ANT-09",
    text: "The weather alert led here: ANT-09's detail shows why the team is flagged — a stale check-in and a rising whiteout risk — with the data's age and source on every number.",
  },
  {
    view: "assistant",
    setup: "ask", // auto-asks the preset question
    selector: '[data-tour="ai-answer"]',
    title: "3 · Ask the AI Assistant",
    text: "The system reads the mission data with fixed rules and suggests an answer — citing its evidence. It never acts on its own; a person decides.",
  },
  {
    view: "assistant",
    selector: '[data-tour="ai-details"]',
    title: "4 · Review the evidence",
    text: "Open “Why the system says this” to see the underlying reasoning: check-in age, weather, oxygen forecast, maintenance. Every claim traces to a record.",
  },
  {
    view: "cargo",
    selector: '[data-tour="payload-check"]',
    title: "5 · Cargo — can it move, and by which route?",
    text: "The weight check enforces the 1,800 kg flight limit before anything is loaded. Each shipment shows its handover trail — compare vessel vs air trade-offs here.",
  },
  {
    view: "assistant",
    selector: '[data-tour="ai-decide"]',
    title: "6 · Record a decision",
    text: "Accept, Reject, Defer or Assign any recommendation. A confirmation dialog always shows the action, target, consequence and approver — with the reason recorded.",
  },
  {
    view: "assistant",
    title: "7 · Confirm in simulation mode",
    text: "When you confirm, the dialog shows the yellow SIMULATED badge. Nothing real is ever executed — the demo banner stays visible on every page.",
  },
  {
    view: "decisions",
    selector: '[data-tour="decision-log"]',
    title: "8 · The memory — decisions & the Black Box",
    text: "Every decision lands in the log with its approval chain, and the Black Box seals the full history so nothing can be quietly changed. That is institutional memory.",
  },
];

export function GuidedTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setView = usePolar((s) => s.setView);
  const openExpedition = usePolar((s) => s.openExpedition);
  const askAssistant = usePolar((s) => s.askAssistant);
  const [step, setStep] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const applyStep = useCallback(
    (index: number) => {
      const s = STEPS[index];
      if (!s) return;
      if (typeof s.setup === "string" && s.setup === "ask") {
        setView(s.view);
        window.setTimeout(() => askAssistant(SUGGESTED_QUESTIONS[0]), 300);
      } else if (s.setup) {
        (s.setup as () => void)();
      } else {
        setView(s.view);
      }
      window.setTimeout(() => {
        cleanupRef.current?.();
        cleanupRef.current = null;
        if (!s.selector) return;
        const el = document.querySelector(s.selector);
        if (el) {
          el.classList.add("tour-active");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          cleanupRef.current = () => el.classList.remove("tour-active");
        }
      }, 550);
    },
    [setView, openExpedition, askAssistant]
  );

  // step 2 needs the store action — attach via a runtime setup
  useEffect(() => {
    STEPS[1].setup = () => openExpedition("ant-09");
  }, [openExpedition]);

  useEffect(() => {
    if (!open) return;
    /* defer first application to a task so no setState runs in the effect body */
    const id = window.setTimeout(() => {
      setStep(0);
      applyStep(0);
    }, 0);
    return () => {
      window.clearTimeout(id);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [open]);

  const goto = (next: number) => {
    if (next >= STEPS.length) {
      onClose();
      return;
    }
    setStep(next);
    applyStep(next);
  };

  if (!open) return null;
  const s = STEPS[step];

  return (
    <>
      {/* dim the page but keep the highlighted element above it visually via outline */}
      <div className="pointer-events-none fixed inset-0 z-[70] bg-slate-900/10" aria-hidden />
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Guided demo"
        className="fixed bottom-4 left-1/2 z-[75] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border-2 border-sky-500 bg-white p-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-tele text-[11.5px] font-bold uppercase tracking-[0.14em] text-sky-600">
              Guided demo · step {step + 1} of {STEPS.length}
            </p>
            <p className="mt-1 text-[15.5px] font-bold text-slate-900">{s.title}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">{s.text}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="End the guided demo" className="shrink-0 rounded border border-slate-300 bg-slate-50 px-2.5 py-1 text-[12px] font-bold text-slate-600 hover:border-slate-400">
            End
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className={cn("h-1.5 w-4 rounded-full", i <= step ? "bg-sky-500" : "bg-slate-200")} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => goto(step - 1)}
              className="inline-flex min-h-[44px] items-center rounded border border-slate-300 bg-white px-3.5 text-[13.5px] font-bold text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => goto(step + 1)}
              className="inline-flex min-h-[44px] items-center rounded bg-sky-600 px-4 text-[13.5px] font-bold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              {step === STEPS.length - 1 ? "Finish tour" : "Next step →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
