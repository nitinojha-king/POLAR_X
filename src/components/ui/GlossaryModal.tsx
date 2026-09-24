"use client";

/**
 * P1-3 — Glossary modal: every domain term explained in plain words.
 * Opened from the top-bar help (ⓘ) button.
 */
import { useEffect } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GLOSSARY, SEVERITY_GUIDE, STATUS_GUIDE, DATA_STATE_GUIDE } from "@/lib/glossary";

function GuideBlock({ title, caption, rows }: { title: string; caption: string; rows: { icon: string; label: string; meaning: string }[] }) {
  return (
    <div className="mb-3 rounded-sm border border-slate-300 bg-slate-50 p-3">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-700">{title}</p>
      <p className="text-[12px] text-slate-500">{caption}</p>
      <dl className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-2">
            <dt className="w-28 shrink-0 text-[13px] font-semibold text-slate-900">
              <span aria-hidden className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", r.icon)} /> {r.label}
            </dt>
            <dd className="text-[12.5px] leading-snug text-slate-600">{r.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function GlossaryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const entries = Object.entries(GLOSSARY);

  return (
    <div ref={trapRef} className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Glossary of plain-English terms">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="px-fadeup relative w-full max-w-xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="flex items-center gap-2 font-tele text-label-caps font-bold uppercase tracking-[0.14em] text-slate-800">
            <BookOpen className="h-4 w-4 text-sky-600" />
            Glossary — what the words mean
          </span>
          <button type="button" onClick={onClose} aria-label="Close glossary" className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-4">
          <p className="mb-3 text-[13px] text-slate-500">
            Underlined dotted words in the app show their meaning on hover. Everything listed here is explained in everyday words — no prior polar experience needed.
          </p>

          {/* STEP 6.3 — canonical vocabulary first */}
          <GuideBlock title="SEVERITY — how bad is it?" caption="An event's severity never changes as time passes." rows={SEVERITY_GUIDE} />
          <GuideBlock title="STATUS — where is it in the workflow?" caption="Status changes as people act on the event." rows={STATUS_GUIDE} />
          <GuideBlock title="DATA STATE — what kind of data is this?" caption="Every record says what kind of data it is." rows={DATA_STATE_GUIDE} />

          <dl className="space-y-2.5">
            {entries.map(([term, def]) => (
              <div key={term} className="rounded-sm border border-slate-200 p-2.5">
                <dt className="text-[13.5px] font-bold text-slate-900">{term}</dt>
                <dd className="mt-0.5 text-[13px] leading-snug text-slate-600">{def}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
