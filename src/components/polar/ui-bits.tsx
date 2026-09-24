"use client";

import { cn } from "@/lib/utils";
import type { OpStatus, RiskLevel, Priority } from "@/lib/polar-data";
import type { ReactNode } from "react";
import { PROVENANCE } from "@/lib/polar-data";
import type { ReadinessStep, CustodyStep } from "@/lib/polar-data";
import { Clock3, RefreshCw, Check, X, ArrowDown, CheckCircle2, AlertTriangle, XCircle, Siren, Truck, Package2 } from "lucide-react";

/* ---------------- status primitives (dark mission-ops) ---------------- */

export const STATUS_STYLES: Record<OpStatus, { dot: string; text: string; bg: string; border: string; label: string }> = {
  OPERATIONAL: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", label: "Working well" },
  ATTENTION: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", label: "Needs attention" },
  CRITICAL: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-300", label: "Critical" },
  STANDBY: { dot: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50", border: "border-sky-300", label: "On standby" },
  MAINTENANCE: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", label: "Under repair" },
};

export function StatusDot({ status, pulse = false, className }: { status: OpStatus; pulse?: boolean; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn("relative inline-flex h-2 w-2 shrink-0", className)}>
      {pulse && <span className={cn("absolute inset-0 rounded-full px-ping", s.dot)} />}
      <span className={cn("relative h-2 w-2 rounded-full", s.dot)} />
    </span>
  );
}

export function StatusChip({ status, label, pulse = false }: { status: OpStatus; label?: string; pulse?: boolean }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-semibold",
        s.bg,
        s.border,
        s.text
      )}
    >
      <StatusDot status={status} pulse={pulse} />
      {label ?? s.label}
    </span>
  );
}

export const RISK_STYLES: Record<RiskLevel, { text: string; bg: string; border: string }> = {
  LOW: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300" },
  MEDIUM: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300" },
  HIGH: { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-300" },
};

export function RiskChip({ level }: { level: RiskLevel }) {
  const r = RISK_STYLES[level];
  const word = level === "LOW" ? "Low" : level === "MEDIUM" ? "Medium" : "High";
  const Icon = level === "LOW" ? CheckCircle2 : level === "MEDIUM" ? AlertTriangle : XCircle;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[12px] font-semibold", r.bg, r.border, r.text)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {word} risk
    </span>
  );
}

export function PriorityChip({ level }: { level: Priority }) {
  const map: Record<Priority, { c: string; label: string; Icon: typeof CheckCircle2 }> = {
    HIGH: { c: "text-rose-700 border-rose-300 bg-rose-50", label: "Urgent", Icon: Siren },
    MEDIUM: { c: "text-amber-700 border-amber-300 bg-amber-50", label: "Important", Icon: AlertTriangle },
    ROUTINE: { c: "text-sky-700 border-sky-300 bg-sky-50", label: "Routine", Icon: CheckCircle2 },
  };
  const m = map[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[12px] font-semibold", m.c)}>
      <m.Icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

/* ---------------- layout primitives ---------------- */

export function Panel({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  /* P1-2: 24px padding on desktop (16px on small screens) */
  return <div className={cn("panel", padded && "p-4 md:p-6", className)}>{children}</div>;
}

export function PanelHeader({
  index,
  title,
  right,
  className,
  pilot,
}: {
  index?: string;
  title: string;
  right?: ReactNode;
  className?: string;
  pilot?: "ok" | "warn" | "alert" | "info";
}) {
  const pilotColor =
    pilot === "warn" ? "bg-amber-500" : pilot === "alert" ? "bg-rose-500" : pilot === "info" ? "bg-sky-500" : "bg-emerald-500";
  return (
    <div className={cn("rail flex min-h-[46px] flex-wrap items-center justify-between gap-2 px-5 py-2.5", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {index && <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-500">{index}</span>}
        {pilot && <span className={cn("pilot", pilotColor, pilot === "alert" && "px-pulse")} />}
        <h3 className="truncate text-[16px] font-semibold tracking-[-0.005em] text-slate-900">{title}</h3>
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">{kicker}</div>
        <h1 className="mt-1 font-display text-[26px] font-bold leading-9 tracking-[-0.02em] text-slate-900">{title}</h1>
        {sub && <p className="mt-1.5 max-w-3xl text-[14.5px] leading-6 text-slate-500">{sub}</p>}
      </div>
      {right && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

/* ---------------- buttons ---------------- */

export function TactButton({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "amber";
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const styles = {
    primary: "bg-sky-600 text-white border border-sky-600 hover:bg-[#1d4ed8] hover:border-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-sky-400/60",
    secondary: "bg-slate-100 text-slate-800 border border-slate-300 hover:border-sky-400 hover:text-sky-700",
    danger: "bg-rose-500 text-white border border-rose-500 hover:bg-rose-400 hover:border-rose-400 focus-visible:ring-2 focus-visible:ring-rose-400/60",
    amber: "bg-amber-500 text-[#1c1206] border border-amber-500 hover:bg-amber-400",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded px-4 py-2.5 text-[14px] font-semibold tracking-[-0.005em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-3.5 py-2 text-[14px] font-semibold tracking-[-0.005em] text-slate-800 transition-colors hover:border-sky-400 hover:text-sky-700"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
        <path d="m15 18-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
}

/* ---------------- data primitives ---------------- */

export function Meter({
  value,
  tone,
  className,
}: {
  value: number;
  tone?: "ok" | "warn" | "alert" | "ice";
  className?: string;
}) {
  const t =
    tone ??
    (value >= 75 ? "ok" : value >= 55 ? "ice" : value >= 45 ? "warn" : "alert");
  const colors: Record<string, string> = {
    ok: "bg-emerald-500",
    ice: "bg-sky-500",
    warn: "bg-amber-500",
    alert: "bg-rose-500",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200/80", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700", colors[t])}
        style={{ width: `${Math.min(100, Math.max(2, value))}%` }}
      />
    </div>
  );
}

export function PrototypeTag({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-sky-300 bg-sky-50 px-2 py-1 text-[12px] font-medium text-sky-700",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
      {children ?? "AI suggests — people decide"}
    </span>
  );
}

/* Data provenance strip — shows data age, source and demo-score so the
   demo never passes simulated data off as a live feed. */
export function Provenance({ className, note }: { className?: string; note?: string }) {
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500",
        className
      )}
    >
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        {PROVENANCE.updated}
      </span>
      <span aria-hidden>·</span>
      <span>{note ?? PROVENANCE.source}</span>
      <span aria-hidden>·</span>
      <span className="font-semibold text-emerald-700">Demo score: high (not calibrated)</span>
    </span>
  );
}

/* ---------------- per-record data source tag ---------
   DEMO DATA (yellow) · FROM NCPOR FEED (green) ·
   ENTERED BY STATION LEADER (blue) — so nobody mistakes
   demo numbers for live ones. */

export type DataSourceKind = "simulated" | "verified" | "user";

export function DataSourceTag({ kind = "simulated", label, className }: { kind?: DataSourceKind; label?: string; className?: string }) {
  const styles = {
    simulated: "border-amber-300 bg-amber-50 text-amber-700",
    verified: "border-emerald-300 bg-emerald-50 text-emerald-700",
    user: "border-sky-300 bg-sky-50 text-sky-700",
  } as const;
  const dot = { simulated: "bg-amber-400", verified: "bg-emerald-400", user: "bg-sky-400" } as const;
  const fallback = {
    simulated: "Demo data",
    verified: "From NCPOR feed",
    user: "Entered by station leader",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11.5px] font-semibold", styles[kind], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[kind])} />
      {label ?? fallback[kind]}
    </span>
  );
}

/* ---------------- data age badge -------
   green = fresh (< 1 h) · yellow 1–4 h · red = old (> 4 h) */

export function DataAgeBadge({
  age,
  tone = "ok",
  label = "Updated",
  className,
}: {
  age: string;
  tone?: "ok" | "warn" | "crit";
  label?: string;
  className?: string;
}) {
  const map = {
    ok: "border-emerald-300 bg-emerald-50 text-emerald-700",
    warn: "border-amber-300 bg-amber-50 text-amber-700",
    crit: "border-rose-300 bg-rose-50 text-rose-700",
  } as const;
  const dot = { ok: "bg-emerald-400", warn: "bg-amber-400", crit: "bg-rose-400" } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] font-semibold", map[tone], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} />
      <Clock3 className="h-3.5 w-3.5" />
      {label}: {age}
    </span>
  );
}

/* ---------------- offline sync queue badge ---------------------- */

export function SyncQueueBadge({
  pending,
  lastSync,
  syncing,
  className,
}: {
  pending: number;
  lastSync: string;
  syncing?: boolean;
  className?: string;
}) {
  if (pending <= 0 && !syncing) {
    return (
      <span className={cn("inline-flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-700", className)}>
        <Check className="h-4 w-4" />
        Everything sent · last sent {lastSync}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-col gap-1 rounded border border-teal-300 bg-teal-100 px-3 py-2", className)}>
      <span className="flex items-center gap-1.5 text-[13px] font-bold text-teal-700">
        <RefreshCw className={cn("h-4 w-4", syncing ? "animate-spin" : "animate-pulse")} />
        {syncing ? "Sending…" : `${pending} update${pending === 1 ? "" : "s"} waiting to send`}
      </span>
      <span className="text-[12px] text-slate-500">
        Urgent things go first: emergencies, then people, cargo, supplies, plans · last sent {lastSync}
      </span>
    </span>
  );
}

/* ---------------- asset readiness meter (4-step) ----------------- */

export function ReadinessMeter({ steps, className }: { steps: ReadinessStep[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {steps.map((s) => (
        <div
          key={s.key}
          title={s.note}
          className={cn(
            "flex min-w-0 flex-col gap-1 rounded border px-2 py-2",
            s.ok ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"
          )}
        >
          <span className="flex items-center gap-1">
            {s.ok ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" /> : <X className="h-3.5 w-3.5 shrink-0 text-rose-700" />}
            <span className={cn("truncate text-[11px] font-bold", s.ok ? "text-emerald-700" : "text-rose-700")}>
              {s.label}
            </span>
          </span>
          <span className="truncate text-[10.5px] leading-snug text-slate-500">{s.note}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- cargo handover trail --------------------------- */

export function CustodyChain({ steps, compact = false, className }: { steps: CustodyStep[]; compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-start", className)}>
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={`${s.place}-${i}`} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
            {!isLast && (
              <span
                className={cn("absolute left-1/2 top-[10px] h-0.5 w-full", s.done ? "bg-emerald-500" : "bg-slate-300")}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                s.done && !s.current
                  ? "border-emerald-500 bg-emerald-500 text-[#06281c]"
                  : s.done && s.current
                    ? "border-sky-500 bg-sky-500 text-[#06281c] ring-4 ring-sky-500/25"
                    : s.current
                      ? "border-amber-400 bg-transparent text-amber-700 ring-4 ring-amber-500/20"
                      : "border-slate-400 bg-transparent text-slate-500"
              )}
            >
              {s.done && !s.current ? "✓" : ""}
            </span>
            <span className={cn("mt-1.5 w-full truncate px-0.5 text-[11px] font-semibold", s.current ? "text-sky-700" : s.done ? "text-slate-700" : "text-slate-500")}>
              {s.place}
            </span>
            {!compact && s.time && <span className="w-full truncate px-0.5 text-[10px] text-slate-500">{s.time}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- cargo + comms chips ---------------- */

export function CargoStatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    "IN TRANSIT": "border-sky-300 bg-sky-50 text-sky-700",
    LOADING: "border-amber-300 bg-amber-50 text-amber-700",
    DELIVERED: "border-emerald-300 bg-emerald-50 text-emerald-700",
    DELAYED: "border-rose-300 bg-rose-50 text-rose-700",
    QUEUED: "border-teal-300 bg-teal-100 text-teal-700",
    SYNCING: "border-teal-300 bg-teal-100 text-teal-700",
    DELIVERED_OK: "border-emerald-300 bg-emerald-50 text-emerald-700",
  };
  const words: Record<string, string> = {
    "IN TRANSIT": "On its way",
    LOADING: "Being loaded",
    DELIVERED: "Delivered",
    DELAYED: "Held up",
    QUEUED: "Waiting to send",
    SYNCING: "Sending…",
    DELIVERED_OK: "Delivered",
  };
  const icons: Record<string, typeof CheckCircle2> = {
    "IN TRANSIT": Truck,
    LOADING: Package2,
    DELIVERED: CheckCircle2,
    DELAYED: AlertTriangle,
    QUEUED: Clock3,
    SYNCING: RefreshCw,
    DELIVERED_OK: CheckCircle2,
  };
  const Icon = icons[status] ?? Clock3;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] font-semibold",
        map[status] ?? "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "SYNCING" && "animate-spin")} aria-hidden />
      {words[status] ?? status}
    </span>
  );
}

export function CommPriorityChip({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    EMERGENCY: "border-rose-300 bg-rose-50 text-rose-700",
    HIGH: "border-amber-300 bg-amber-50 text-amber-700",
    NORMAL: "border-sky-300 bg-sky-50 text-sky-700",
  };
  const words: Record<string, string> = { EMERGENCY: "Emergency", HIGH: "Urgent", NORMAL: "Normal" };
  const icons: Record<string, typeof CheckCircle2> = { EMERGENCY: Siren, HIGH: AlertTriangle, NORMAL: CheckCircle2 };
  const Icon = icons[priority] ?? CheckCircle2;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] font-semibold", map[priority] ?? map.NORMAL)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {words[priority] ?? priority}
    </span>
  );
}

/* small inline sparkline used on KPI cards */
export function Sparkline({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={cn("h-8 w-16 shrink-0 text-sky-700", className)} fill="none" viewBox="0 0 64 32">
      <path d={d} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      <circle cx="64" cy="8" r="2.5" fill="currentColor" />
    </svg>
  );
}

/* donut ring used on KPI cards */
export function Donut({ value, tone = "amber", caption }: { value: number; tone?: "amber" | "sky" | "rose" | "emerald"; caption?: string }) {
  const stroke = { amber: "text-amber-500", sky: "text-sky-500", rose: "text-rose-500", emerald: "text-emerald-500" }[tone];
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
        <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
        <path className={stroke} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${value}, 100`} strokeLinecap="round" strokeWidth="3.5" />
      </svg>
      <span className="absolute text-[10.5px] font-bold text-slate-800">{caption ?? `${value}%`}</span>
    </div>
  );
}

/* expand/collapse hint used by progressive-disclosure cards */
export function ViewMoreHint({ open, label = "Show more" }: { open: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-sky-700">
      {open ? "Show less" : label}
      <ArrowDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
    </span>
  );
}
