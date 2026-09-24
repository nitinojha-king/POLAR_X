"use client";

/**
 * P2-7 — designed error/empty states.
 * Every list, action and sync path can show a proper state instead of
 * a blank area: empty · loading · offline · stale · denied · failed.
 */
import { useState, type ReactNode } from "react";
import {
  Inbox,
  Loader2,
  CloudOff,
  Clock,
  Lock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function StateShell({
  icon,
  title,
  detail,
  tone,
  action,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  tone: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1.5 rounded-md border px-6 py-8 text-center", tone)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-current/20">{icon}</span>
      <p className="text-[14.5px] font-bold text-slate-800">{title}</p>
      <p className="max-w-sm text-[13px] leading-relaxed text-slate-500">{detail}</p>
      {action}
    </div>
  );
}

export function EmptyState({ what, hint, action }: { what: string; hint?: string; action?: ReactNode }) {
  return (
    <StateShell
      icon={<Inbox className="h-5 w-5 text-slate-600" />}
      title={`Nothing here yet — no ${what}`}
      detail={hint ?? "Try a different search or filter — the data updates as the field teams report in."}
      tone="border-slate-200 bg-slate-50"
      action={action}
    />
  );
}

export function LoadingState({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-6 py-8" role="status" aria-live="polite">
      <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
      <p className="text-[13.5px] font-semibold text-slate-700">Loading {what}…</p>
      <div className="mt-1 w-full max-w-xs space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-slate-200" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function OfflineState({ pending, onRetry }: { pending?: number; onRetry?: () => void }) {
  return (
    <StateShell
      icon={<CloudOff className="h-5 w-5 text-amber-600" />}
      title="No connection — working from saved data"
      detail={pending ? `${pending} update${pending === 1 ? "" : "s"} saved on this device and waiting to send. Everything else still works offline.` : "Updates are saved on this device and send automatically when the link returns."}
      tone="border-amber-300 bg-amber-50"
      action={onRetry && <button type="button" onClick={onRetry} className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded border border-amber-400 bg-white px-3 text-[13px] font-bold text-amber-800 hover:border-amber-600"><RefreshCw className="h-3.5 w-3.5" /> Try to reconnect</button>}
    />
  );
}

export function StaleState({ age, source, onRefresh }: { age: string; source?: string; onRefresh?: () => void }) {
  return (
    <StateShell
      icon={<Clock className="h-5 w-5 text-rose-600" />}
      title={`This data is old — last updated ${age}`}
      detail={source ? `Source: ${source}. Rule R-05 flags records older than 8 hours — decide with care or request a refresh.` : "Rule R-05 flags records older than 8 hours — decide with care or request a refresh."}
      tone="border-rose-300 bg-rose-50"
      action={onRefresh && <button type="button" onClick={onRefresh} className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded border border-rose-400 bg-white px-3 text-[13px] font-bold text-rose-700 hover:border-rose-600"><RefreshCw className="h-3.5 w-3.5" /> Request refresh</button>}
    />
  );
}

export function PermissionDenied({ what, role = "Station member (no admin rights)" }: { what: string; role?: string }) {
  return (
    <StateShell
      icon={<Lock className="h-5 w-5 text-slate-500" />}
      title={`Not allowed — ${what} needs admin rights`}
      detail={`You are signed in as ${role}. Ask the Station Leader for admin rights, or request the change for them to approve.`}
      tone="border-slate-300 bg-slate-100"
    />
  );
}

export function FailedAction({ what, onRetry, onDismiss }: { what: string; onRetry: () => void; onDismiss?: () => void }) {
  const [retrying, setRetrying] = useState(false);
  return (
    <StateShell
      icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
      title={`That didn't go through — ${what}`}
      detail="Nothing was lost. Retry now — if the satellite link is busy it may take a moment."
      tone="border-rose-300 bg-rose-50"
      action={
        <span className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRetrying(true);
              window.setTimeout(() => {
                setRetrying(false);
                onRetry();
              }, 900);
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded bg-rose-500 px-3 text-[13px] font-bold text-white hover:bg-rose-600"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} /> {retrying ? "Retrying…" : "Retry"}
          </button>
          {onDismiss && (
            <button type="button" onClick={onDismiss} className="inline-flex min-h-[44px] items-center rounded border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-600 hover:border-slate-400">
              Dismiss
            </button>
          )}
        </span>
      }
    />
  );
}
