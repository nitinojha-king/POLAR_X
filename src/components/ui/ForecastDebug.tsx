"use client";

/**
 * STEP 1.4 — ForecastDebug: "show your work" component.
 * The depletion numbers on screen can be traced to ONE calculation.
 * Mounted under the supply forecast chart so judges (and operators)
 * can verify that card, chart, alert and tooltip all agree.
 */
import { useState } from "react";
import { ChevronDown, Calculator } from "lucide-react";
import type { ForecastResult } from "@/lib/forecast";
import { getNow, formatAbsoluteTime } from "@/lib/clock";
import { cn } from "@/lib/utils";

interface ForecastDebugProps {
  name: string;
  stockLabel: string;
  currentStock: number;
  burnRatePerDay: number;
  alertThreshold: number;
  forecast: ForecastResult;
  defaultOpen?: boolean;
}

export function ForecastDebug({
  name,
  stockLabel,
  currentStock,
  burnRatePerDay,
  alertThreshold,
  forecast,
  defaultOpen = false,
}: ForecastDebugProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      data-forecast-debug={name.toLowerCase()}
      className="mt-2 overflow-hidden rounded-sm border border-slate-200 bg-white"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-600">
          <Calculator className="h-3.5 w-3.5 text-sky-600" aria-hidden />
          Show the calculation — how &ldquo;{name}&rdquo; numbers are worked out
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] sm:grid-cols-2">
          <div className="flex justify-between gap-3 sm:contents">
            <dt className="text-slate-500">Current stock</dt>
            <dd className="text-right font-semibold text-slate-800 sm:text-left">{stockLabel}</dd>
          </div>
          <div className="flex justify-between gap-3 sm:contents">
            <dt className="text-slate-500">Burn rate</dt>
            <dd className="text-right font-semibold text-slate-800 sm:text-left">{burnRatePerDay} units/day</dd>
          </div>
          <div className="flex justify-between gap-3 sm:contents">
            <dt className="text-slate-500">Alert threshold</dt>
            <dd className="text-right font-semibold text-slate-800 sm:text-left">{alertThreshold} units</dd>
          </div>
          <div className="flex justify-between gap-3 sm:contents">
            <dt className="text-slate-500">Days to alert line</dt>
            <dd className="text-right font-semibold text-slate-800 sm:text-left">{forecast.daysUntilAlert} days</dd>
          </div>
          <div className="flex justify-between gap-3 sm:contents">
            <dt className="text-slate-500">Days to zero</dt>
            <dd className="text-right font-semibold text-slate-800 sm:text-left">{forecast.daysUntilZero} days</dd>
          </div>
          <div className="flex justify-between gap-3 sm:contents">
            <dt className="text-slate-500">Formula</dt>
            <dd className="text-right font-mono text-[11.5px] font-semibold text-slate-800 sm:text-left">{forecast.formula}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-slate-200 pt-1.5 sm:col-span-2">
            <dt className="text-slate-500">Last computed</dt>
            <dd className="text-right font-semibold text-slate-700">
              {formatAbsoluteTime(getNow().toISOString())} · model status {forecast.status}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
