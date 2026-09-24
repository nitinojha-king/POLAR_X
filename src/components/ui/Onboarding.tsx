"use client";

/**
 * P1-4 — first-visit onboarding overlay.
 * Shows once (localStorage `polarx_onboarded`), tells the judge who
 * they are and what their job is, then lets them into the demo.
 */
import { useEffect, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { MonitorCheck, Boxes, HandHeart } from "lucide-react";

const KEY = "polarx_onboarded";

export function Onboarding() {
  /* STEP 13 — mount-gated: localStorage is only read AFTER hydration so
     server and client render the same first paint (no mismatch). */
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      setShow(!window.localStorage.getItem(KEY));
    } catch {
      setShow(false);
    }
    setChecked(true);
  }, []);

  /* STEP 13 — hooks before the early return */
  const trapRef = useFocusTrap<HTMLDivElement>(show && checked);

  if (!show || !checked) return null;

  const finish = () => {
    try {
      window.localStorage.setItem(KEY, "true");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const jobs = [
    { icon: MonitorCheck, text: "Watch the whole expedition across a 3,000 km network — from one calm screen" },
    { icon: Boxes, text: "Approve logistics, cargo and resupply decisions — the system only suggests" },
    { icon: HandHeart, text: "Coordinate emergency response when something goes wrong out on the ice" },
  ];

  return (
    <div ref={trapRef} className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Welcome to POLAR-X">
      <div className="px-fadeup w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold tracking-[-0.01em] text-slate-900">👋 Welcome to POLAR-X</h2>
        <div className="mt-4 space-y-3">
          <p className="text-lg font-semibold text-slate-900">You are the Station Operations Leader.</p>
          <p className="text-[14.5px] text-slate-600">Your job during this demo:</p>
          <ul className="space-y-2">
            {jobs.map((j) => (
              <li key={j.text} className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] leading-snug text-slate-700">
                <j.icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky-600" />
                {j.text}
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] leading-relaxed text-slate-500">
            Everything here is a simulation for SIH 2026 — no real stations, vehicles or people. A yellow banner stays at the top the whole time.
          </p>
        </div>
        <button
          type="button"
          onClick={finish}
          className="mt-6 w-full rounded-lg bg-emerald-500 py-3 text-[15px] font-bold text-white transition-colors hover:bg-emerald-600"
        >
          Got it — Start Demo →
        </button>
      </div>
    </div>
  );
}
