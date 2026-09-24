"use client";

/**
 * P0-3 — reusable confirmation modal for HIGH-CONSEQUENCE actions.
 * Every consequential action (transmit, create/acknowledge incident,
 * accept an AI recommendation, submit a resupply proposal) must pass
 * through here so the operator sees action · target · priority ·
 * consequence · mode · approver BEFORE it happens.
 */
import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;

export interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  /** receives the typed reason (empty when requireReason is off) */
  onConfirm: (reason: string) => void;
  /** e.g. "Transmit HIGH message" */
  action: string;
  /** e.g. "ALL UNITS" */
  target: string;
  priority: ConfirmPriority;
  /** e.g. "Will be added to communications log" */
  consequence: string;
  isSimulated: boolean;
  /** e.g. "Cmdr. V. Vance" */
  approver: string;
  /** e.g. "Confirm & Transmit" — defaults to "Confirm" */
  confirmLabel?: string;
  /** show a reason input (used for AI recommendations) */
  requireReason?: boolean;
  /** extra proposal details (source, eta, cost, status…) */
  details?: { label: string; value: string }[];
  /** multi-button footer (e.g. Save Draft / Queue / Submit) — replaces the single confirm */
  actions?: { label: string; onPick: (reason: string) => void; primary?: boolean }[];
}

const PRIORITY_TONE: Record<string, string> = {
  LOW: "border-sky-300 bg-sky-50 text-sky-700",
  ROUTINE: "border-sky-300 bg-sky-50 text-sky-700",
  NORMAL: "border-sky-300 bg-sky-50 text-sky-700",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-800",
  HIGH: "border-amber-300 bg-amber-50 text-amber-800",
  CRITICAL: "border-rose-300 bg-rose-50 text-rose-700",
  EMERGENCY: "border-rose-300 bg-rose-50 text-rose-700",
};

export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  action,
  target,
  priority,
  consequence,
  isSimulated,
  approver,
  confirmLabel = "Confirm",
  requireReason = false,
  details = [],
  actions,
}: ConfirmationModalProps) {
  const [reason, setReason] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  /* STEP 13 — trap Tab focus inside the dialog while open, restore on close */
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const wasOpen = useRef(false);

  useEffect(() => {
    /* reset the reason after close (not during the effect itself) */
    if (!open && wasOpen.current) {
      wasOpen.current = false;
      const id = window.setTimeout(() => setReason(""), 0);
      return () => window.clearTimeout(id);
    }
    if (open) wasOpen.current = true;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    cancelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  /* Fixed rows always render; caller details with a colliding label are
     dropped so keys stay unique and the row never renders twice. */
  const FIXED_LABELS = new Set(["Action", "Target", "Priority", "Consequence", "Mode", "Approver"]);
  const rows: { label: string; value: React.ReactNode; tone?: string }[] = [
    { label: "Action", value: action },
    { label: "Target", value: target },
    {
      label: "Priority",
      value: <span className="font-bold uppercase">{priority}</span>,
      tone: PRIORITY_TONE[priority.toUpperCase()] ?? "border-slate-300 bg-slate-50 text-slate-700",
    },
    { label: "Consequence", value: consequence },
    {
      label: "Mode",
      value: isSimulated ? (
        <span className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[12px] font-bold text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          SIMULATED — demo data, nothing real happens
        </span>
      ) : (
        "Live"
      ),
    },
    ...details
      .filter((d) => !FIXED_LABELS.has(d.label))
      .map((d) => ({ label: d.label, value: d.value })),
    {
      label: "Approver",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          {approver} <span className="font-medium text-slate-500">(human sign-off)</span>
        </span>
      ),
    },
  ];

  return (
    <div ref={trapRef} className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm action">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="px-fadeup relative w-full max-w-lg overflow-hidden rounded-md border-2 border-amber-400 bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-amber-50 px-4 py-2.5">
          <span className="flex items-center gap-2 font-tele text-label-caps font-bold uppercase tracking-[0.14em] text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Confirm action
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* rows */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <dl className="space-y-2">
            {rows.map((r, i) => (
              <div key={`${r.label}-${i}`} className="grid grid-cols-[110px_1fr] items-start gap-3">
                <dt className="pt-0.5 font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">{r.label}</dt>
                <dd className={cn("text-[13.5px] leading-snug text-slate-800", r.label === "Priority" && "inline-flex w-fit rounded border px-2 py-0.5", r.tone && r.label === "Priority" && r.tone)}>
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>

          {requireReason && (
            <div className="mt-3">
              <label htmlFor="px-confirm-reason" className="font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">
                Reason (recorded in the Decision Log)
              </label>
              <textarea
                id="px-confirm-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why this action? e.g. weather window + stale check-in…"
                className="mt-1.5 w-full resize-none rounded-sm border border-slate-300 bg-white p-2 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-slate-300 bg-white px-4 text-[14px] font-semibold text-slate-700 transition-colors hover:border-slate-400"
          >
            Cancel
          </button>
          {actions
            ? actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    a.onPick(reason);
                    onClose();
                  }}
                  className={cn(
                    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded px-4 text-[14px] font-bold transition-colors",
                    a.primary
                      ? "bg-sky-600 text-white hover:bg-[#1d4ed8]"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700"
                  )}
                >
                  {a.label}
                </button>
              ))
            : (
                <button
                  type="button"
                  onClick={() => {
                    onConfirm(reason);
                    onClose();
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded bg-sky-600 px-4 text-[14px] font-bold text-white transition-colors hover:bg-[#1d4ed8]"
                >
                  {confirmLabel}
                </button>
              )}
        </div>
      </div>
    </div>
  );
}
