"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Package2,
  Cog,
  Search,
  FileDown,
  ClipboardList,
  CircleCheck,
  TriangleAlert,
  BrainCircuit,
  Upload,
  Plus,
  CloudSun,
  Ship,
  Wrench,
  Link2,
  type LucideIcon,
} from "lucide-react";
import {
  ASSETS,
  INVENTORY,
  FORECASTS,
  SUPPLY_FORECASTS,
  SITE_STOCK,
  RESUPPLY_FLEET,
  WEATHER_WINDOWS,
  RESUPPLY_PLANS,
  assetReadiness,
  assetReadinessPct,
  ENVIRONMENT,
  type Asset,
  type SupplyKey,
} from "@/lib/polar-data";
import { usePolar } from "@/lib/polar-store";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { SortToggle, type SortMode } from "@/components/DataAge";
import { EmptyState, StaleState } from "@/components/ui/states";
import { ForecastDebug } from "@/components/ui/ForecastDebug";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { DataQualityLine } from "@/components/ui/DataQualityLine";
import { scenarioIsoMinusMinutes } from "@/lib/clock";
import type { ForecastResult } from "@/lib/forecast";
import { cn } from "@/lib/utils";
import {
  Panel,
  PanelHeader,
  PageHeader,
  StatusChip,
  Meter,
  Provenance,
  PrototypeTag,
  RiskChip,
  TactButton,
  ReadinessMeter,
  DataSourceTag,
  DataAgeBadge,
} from "./ui-bits";

/* ================================================================== */
/* Shared: view toggle + category icons                                */
/* ================================================================== */

export type InvTab = "assets" | "inventory";

function ViewToggle({ tab }: { tab: InvTab }) {
  const setView = usePolar((s) => s.setView);
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-300" role="tablist" aria-label="Equipment and supplies toggle">
      <button
        type="button"
        role="tab"
        aria-selected={tab === "assets"}
        onClick={() => setView("assets")}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold transition-colors",
          tab === "assets" ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-600 hover:text-slate-800"
        )}
      >
        <Cog className="h-3.5 w-3.5" /> Equipment
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "inventory"}
        onClick={() => setView("logistics")}
        className={cn(
          "flex items-center gap-1.5 border-l border-slate-300 px-4 py-2 text-[13px] font-semibold transition-colors",
          tab === "inventory" ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-600 hover:text-slate-800"
        )}
      >
        <Package2 className="h-3.5 w-3.5" /> Supplies
      </button>
    </div>
  );
}

const CATEGORY_ICON: Record<Asset["category"], LucideIcon> = {
  Vehicle: Wrench,
  UAV: Cog,
  Instrument: Link2,
  Power: Upload,
  Container: Package2,
  Support: CircleCheck,
};

/* readiness status word per spec: Ready / Inspection due / Out of service */
function readinessWord(a: Asset): { label: string; cls: string } {
  if (a.status === "CRITICAL") return { label: "Out of service", cls: "border-rose-300 bg-rose-50 text-rose-700" };
  if (a.status === "ATTENTION" || a.status === "MAINTENANCE") return { label: "Inspection due", cls: "border-amber-300 bg-amber-50 text-amber-700" };
  if (a.status === "STANDBY") return { label: "Ready (standby)", cls: "border-sky-300 bg-sky-50 text-sky-700" };
  return { label: "Ready", cls: "border-emerald-300 bg-emerald-50 text-emerald-700" };
}

/* ================================================================== */
/* ASSETS tab                                                          */
/* ================================================================== */

function Schematic({ category, alarm }: { category: Asset["category"]; alarm: boolean }) {
  const stroke = "#94a3b8";
  const hi = alarm ? "#dc2626" : "#2563eb";
  const common = { fill: "none", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <svg viewBox="0 0 320 130" className="h-36 w-full" role="img" aria-label={`${category} schematic`}>
      <rect x="4" y="4" width="312" height="122" rx="3" fill="#e8eef5" stroke="#cbd5e1" />
      {Array.from({ length: 8 }).map((_, i) =>
        Array.from({ length: 3 }).map((_, j) => <circle key={`${i}-${j}`} cx={40 + i * 34} cy={30 + j * 34} r="0.9" fill="#b3c3d6" />)
      )}

      {category === "Vehicle" && (
        <g stroke={stroke} {...common}>
          <path d="M60 84 L60 60 L110 42 L190 42 L216 62 L258 62 L258 84 Z" />
          <rect x="120" y="50" width="34" height="18" rx="2" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" />
          <circle cx="96" cy="92" r="12" stroke={hi} strokeWidth="2" strokeDasharray={alarm ? "3 3" : undefined} />
          <circle cx="96" cy="92" r="4" />
          <circle cx="222" cy="92" r="12" />
          <circle cx="222" cy="92" r="4" />
          <path d="M84 92 h30 M204 92 h30" />
        </g>
      )}
      {category === "UAV" && (
        <g stroke={stroke} {...common}>
          <circle cx="160" cy="65" r="14" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" />
          <path d="M150 55 L110 32 M170 55 L210 32 M150 75 L110 98 M170 75 L210 98" />
          {[110, 210].map((cx) =>
            [32, 98].map((cy) => (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r="9" stroke={hi} strokeWidth="2" strokeDasharray={alarm ? "3 3" : undefined} />
                <path d={`M${cx - 13} ${cy} h26 M${cx} ${cy - 13} v26`} strokeOpacity="0.4" />
              </g>
            ))
          )}
          <path d="M154 65 h12 M160 59 v12" />
        </g>
      )}
      {category === "Instrument" && (
        <g stroke={stroke} {...common}>
          <path d="M160 100 L160 58" />
          <path d="M120 40 A46 46 0 0 1 200 40" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" />
          <path d="M132 44 L160 58 L188 44" strokeOpacity="0.5" />
          <path d="M140 100 h40 M130 108 h60" />
          <path d="M212 32 L236 24" stroke={hi} strokeWidth="2" strokeDasharray={alarm ? "3 3" : undefined} />
          <circle cx="240" cy="22" r="3" fill={hi} stroke="none" />
        </g>
      )}
      {category === "Power" && (
        <g stroke={stroke} {...common}>
          <rect x="96" y="46" width="128" height="54" rx="3" />
          <path d="M108 58 h20 M108 66 h20 M108 74 h20 M108 82 h20" strokeOpacity="0.5" />
          <circle cx="188" cy="73" r="14" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" />
          <path d="M188 65 v8 l6 4" />
          <path d="M96 100 h128" />
          <path d="M224 46 L244 30" stroke={hi} strokeWidth="2" strokeDasharray={alarm ? "3 3" : undefined} />
        </g>
      )}
      {category === "Container" && (
        <g stroke={stroke} {...common}>
          <path d="M92 90 L92 48 L200 40 L228 56 L228 98 Z" fill="#c9d7e6" />
          <path d="M200 40 L200 88 L228 98" />
          <path d="M92 48 L200 88" strokeOpacity="0.35" />
          <rect x="104" y="62" width="26" height="18" rx="2" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" />
          <path d="M212 34 L232 22" stroke={hi} strokeWidth="2" strokeDasharray={alarm ? "3 3" : undefined} />
        </g>
      )}
      {category === "Support" && (
        <g stroke={stroke} {...common}>
          <path d="M64 86 L64 56 L104 48 L150 48 L172 66 L232 66 L232 86 Z" fill="#c9d7e6" />
          <rect x="176" y="52" width="30" height="14" rx="2" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" />
          <circle cx="98" cy="92" r="11" stroke={hi} strokeWidth="2" strokeDasharray={alarm ? "3 3" : undefined} />
          <circle cx="98" cy="92" r="3.5" />
          <circle cx="200" cy="92" r="11" />
          <circle cx="200" cy="92" r="3.5" />
        </g>
      )}

      {[[14, 14], [306, 14], [14, 116], [306, 116]].map(([x, y]) => (
        <g key={`${x}-${y}`} stroke="#6c83a0" strokeWidth="1">
          <path d={`M${x - 4} ${y} h8 M${x} ${y - 4} v8`} />
        </g>
      ))}
    </svg>
  );
}

/* dependency chain: spares → asset → expedition (simple, 3 nodes) */
function DependencyChain({ asset }: { asset: Asset }) {
  const sp = (asset.spareParts ?? "").toLowerCase();
  const sparesBlocked = sp.includes("delayed") || sp.includes("cg-131");
  const nodes = [
    {
      label: "Spare parts",
      value: sparesBlocked ? "Held — CG-131 stuck at port" : "Maitri workshop stock",
      tone: sparesBlocked ? "warn" : "ok",
    },
    {
      label: asset.id,
      value: asset.status === "CRITICAL" ? "Out of service" : asset.status === "MAINTENANCE" ? "Work order pending" : "In service",
      tone: asset.status === "CRITICAL" ? "alert" : asset.status === "MAINTENANCE" || asset.status === "ATTENTION" ? "warn" : "ok",
    },
    {
      label: "Expedition",
      value: asset.expedition,
      tone: asset.status === "CRITICAL" ? "warn" : "ok",
    },
  ] as const;

  return (
    <div className="rounded-sm border border-slate-200 p-3">
      <span className="flex items-center gap-2 font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">
        <Link2 className="h-3.5 w-3.5 text-sky-700" /> What it depends on
      </span>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex items-center gap-2">
            <span className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              n.tone === "alert" ? "bg-rose-500" : n.tone === "warn" ? "bg-amber-500" : "bg-emerald-500"
            )} />
            <span className="w-28 shrink-0 text-[12px] font-bold uppercase tracking-[0.06em] text-slate-500">{n.label}</span>
            <span className={cn(
              "min-w-0 flex-1 truncate rounded border px-2 py-1 text-[12.5px] font-medium",
              n.tone === "alert" ? "border-rose-300 bg-rose-50 text-rose-700" : n.tone === "warn" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"
            )}>
              {n.value}
            </span>
            {i < nodes.length - 1 && <span className="text-slate-500">↓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetDetail({ asset }: { asset: Asset }) {
  const [auth, setAuth] = useState(false);
  const alarm = asset.prediction.risk === "HIGH";
  const steps = assetReadiness(asset);
  const pct = assetReadinessPct(asset);

  return (
    <Panel padded={false} className="overflow-hidden">
      <div className="border-b border-slate-200 bg-amber-50 px-3.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-tele text-label-micro font-bold uppercase tracking-[0.16em] text-amber-700">
            Equipment detail · {asset.id}
          </span>
          <StatusChip status={asset.status} pulse={asset.status === "CRITICAL"} />
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="font-display text-headline-md text-slate-900">{asset.type}</h3>
        <p className="font-tele text-label-micro uppercase tracking-wider text-slate-500">
          {asset.location} · {asset.expedition}
        </p>

        {/* P2-7 — designed stale state when the inspection record is old (R-03/R-05) */}
        {(asset.status === "MAINTENANCE" || asset.status === "CRITICAL") && (
          <div className="mt-3">
            <StaleState
              age={(asset.lastInspection ?? asset.lastMaintenance).replace(/\s*\(.*\)/, "")}
              source="maintenance record"
              onRefresh={() => toast.success("Refresh requested — maintenance team notified (demo)")}
            />
          </div>
        )}

        {/* readiness meter — Location known → Inspection valid → Spare available → Crew assigned */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-500">Ready-to-use check</span>
            <span className={cn("font-tele text-[13px] font-bold", pct === 100 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-rose-700")}>
              {pct}% ready
            </span>
          </div>
          <ReadinessMeter steps={steps} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-5">
          <div className="well sm:col-span-3 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-500">Diagram</span>
              <span className="text-[12px] font-semibold text-emerald-700">Sensors working</span>
            </div>
            <Schematic category={asset.category} alarm={alarm} />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:col-span-2">
            {[
              { k: "Battery", v: `${asset.battery}%`, tone: asset.battery < 60 ? "text-amber-700" : "text-slate-800" },
              { k: "Core temp", v: asset.temperature.split(" ")[0], tone: "text-slate-800" },
              { k: "Health", v: `${asset.health}%`, tone: asset.health < 50 ? "text-rose-700" : asset.health < 75 ? "text-amber-700" : "text-emerald-700" },
              { k: "Last serviced", v: asset.lastMaintenance, tone: "text-slate-800" },
            ].map((t) => (
              <div key={t.k} className="well px-2.5 py-2">
                <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{t.k}</div>
                <div className={cn("mt-0.5 font-tele text-telemetry-sm font-bold", t.tone)}>{t.v}</div>
              </div>
            ))}
            <div className="col-span-2 well px-2.5 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-500">Condition</span>
                <RiskChip level={asset.prediction.risk} />
              </div>
              <Meter value={asset.health} className="mt-1.5" />
            </div>
          </div>
        </div>

        {/* AI advisory — honest labeling */}
        <div className="mt-3 rounded-sm border border-sky-300 bg-sky-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-sky-700">
              <BrainCircuit className="h-4 w-4 text-sky-700" />
              Will it break soon? — AI check
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-sky-700">Demo score: {asset.id === "ATV-021" ? "94%" : "88%"} (not calibrated)</span>
              <PrototypeTag>AI suggests — humans decide</PrototypeTag>
            </span>
          </div>
          <p className="mt-1.5 text-body-md leading-relaxed text-slate-700">
            {asset.prediction.basis}. The AI estimates it will need service in{" "}
            <span className={cn("font-tele font-bold", alarm ? "text-rose-700" : "text-slate-900")}>
              {asset.prediction.days} working hours
            </span>{" "}
            — the chance of a breakdown looks <span className={cn("font-tele font-bold", alarm ? "text-rose-700" : "text-amber-700")}>{asset.prediction.risk === "HIGH" ? "high" : asset.prediction.risk === "MEDIUM" ? "medium" : "low"}</span>.
            {asset.note ? ` ${asset.note}` : ""}
          </p>
          {asset.recommendation && (
            <p className="mt-1.5 rounded-sm border border-amber-300 bg-amber-50 px-2 py-1.5 text-body-sm font-medium text-amber-700">
              Suggestion: {asset.recommendation}
            </p>
          )}
          <div className="mt-1 font-tele text-label-micro uppercase tracking-wider text-slate-500">
            Demo estimate — not a certified prediction
          </div>
        </div>

        {/* ops facts */}
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { k: "Where it is", v: asset.location },
            { k: "Last inspection", v: asset.lastInspection ?? asset.lastMaintenance },
            { k: "Fuel / battery", v: asset.fuelOrBattery ?? `Battery ${asset.battery}%` },
            { k: "Service state", v: asset.id === "ATV-021" ? "9 days overdue" : `Last serviced ${asset.lastMaintenance}` },
          ].map((t) => (
            <div key={t.k} className="well px-2.5 py-2">
              <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{t.k}</div>
              <div className={cn("mt-0.5 font-tele text-telemetry-sm font-bold", t.k === "Service state" && asset.id === "ATV-021" ? "text-rose-700" : "text-slate-800")}>
                {t.v}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {/* spares */}
          <div className="rounded-sm border border-slate-200 p-3">
            <span className="text-[13px] font-semibold text-slate-700">Spare parts</span>
            <p className="mt-1.5 text-body-sm text-slate-600">{asset.spareParts ?? "No critical shortages"}</p>
          </div>
          <DependencyChain asset={asset} />
        </div>

        {/* maintenance history */}
        <div className="mt-3 rounded-sm border border-slate-200 p-3">
          <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-slate-700">Recent service history</span>
          <div className="mt-2 divide-y divide-slate-100">
            {asset.maintenanceHistory.map((h, i) => (
              <div key={h} className="flex items-center justify-between gap-2 py-1.5">
                <span className="flex items-center gap-2 text-body-sm text-slate-600">
                  <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {h}
                </span>
                <span className="font-tele text-label-micro uppercase tracking-wider text-slate-500">
                  {i === 0 ? asset.lastMaintenance : `${14 + i * 27} days prior`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* work order — human approval gate */}
        <div className="mt-3 rounded-sm border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-2 font-tele text-label-caps font-semibold uppercase tracking-wider text-slate-600">
              <input
                type="checkbox"
                checked={auth}
                onChange={(e) => setAuth(e.target.checked)}
                className="h-3.5 w-3.5 rounded-sm border-slate-400 accent-sky-600"
              />
              Leader approval
            </label>
            <div className="flex gap-2">
              <TactButton
                disabled={!auth}
                onClick={() => {
                  toast.success(`Repair job WO-${asset.id}-0926 created (demo)`);
                  setAuth(false);
                }}
              >
                <ClipboardList className="h-3.5 w-3.5" /> Create repair job
              </TactButton>
              <TactButton variant="secondary" onClick={() => toast.success(`Raw sensor data for ${asset.id} queued for download — 41.2 MB (demo)`)}>
                <FileDown className="h-3.5 w-3.5" /> Download raw data
              </TactButton>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3.5 py-2">
        <span className="flex items-center gap-2 font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">
          Conditions at the site: {ENVIRONMENT.temp} · wind {ENVIRONMENT.wind}
        </span>
        <DataAgeBadge age="13 min" tone="ok" label="Sensor data" />
      </div>
    </Panel>
  );
}

function AssetsTab() {
  const selectedId = usePolar((s) => s.selectedAssetId);
  const openAsset = usePolar((s) => s.openAsset);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  /* P1-2 — max 6 equipment cards in view */
  const [showAllAssets, setShowAllAssets] = useState(false);
  /* P2-2 — sort by most urgent / most stale */
  const [sortMode, setSortMode] = useState<SortMode>("urgent");

  const rows = useMemo(() => {
    const filtered = ASSETS.filter((a) => {
      const inFilter =
        filter === "all" ||
        (filter === "ready" && (a.status === "OPERATIONAL" || a.status === "STANDBY")) ||
        (filter === "due" && (a.status === "ATTENTION" || a.status === "MAINTENANCE")) ||
        (filter === "out" && a.status === "CRITICAL");
      const q = query.trim().toLowerCase();
      const inQuery = !q || `${a.id} ${a.type} ${a.location}`.toLowerCase().includes(q);
      return inFilter && inQuery;
    });
    /* P2-2 — most urgent: due/out first, lowest readiness inside the tier;
       most stale: oldest inspection/maintenance first */
    const rank = (a: (typeof ASSETS)[number]) => (a.status === "CRITICAL" ? 0 : a.status === "ATTENTION" || a.status === "MAINTENANCE" ? 1 : 2);
    const inspectMs = (a: (typeof ASSETS)[number]) => {
      const raw = (a.lastInspection ?? a.lastMaintenance).replace(/\s*\(.*\)/, "");
      const t = Date.parse(raw);
      return Number.isNaN(t) ? 0 : t;
    };
    return [...filtered].sort((a, b) => {
      if (sortMode === "stale") return inspectMs(a) - inspectMs(b);
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      return assetReadinessPct(a) - assetReadinessPct(b);
    });
  }, [filter, query, sortMode]);

  const selected = ASSETS.find((a) => a.id === (selectedId ?? "ATV-021")) ?? ASSETS[0];
  const ready = ASSETS.filter((a) => a.status === "OPERATIONAL" || a.status === "STANDBY").length;
  const due = ASSETS.filter((a) => a.status === "ATTENTION" || a.status === "MAINTENANCE").length;
  const out = ASSETS.filter((a) => a.status === "CRITICAL").length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* cards grid */}
      <div className="space-y-3 lg:col-span-7">
        <Panel className="flex flex-wrap items-center gap-4 py-3">
          <label className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search equipment by ID, type or place…"
              className="w-full rounded border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2 text-body-sm text-slate-800 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { k: "all", label: `All (${ASSETS.length})` },
              { k: "ready", label: `Ready (${ready})` },
              { k: "due", label: `Inspection due (${due})` },
              { k: "out", label: `Out of service (${out})` },
            ].map((f) => (
              <button
                key={f.k}
                type="button"
                onClick={() => setFilter(f.k)}
                className={cn(
                  "rounded border px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors",
                  filter === f.k ? "border-sky-500 bg-sky-600 text-white" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-sky-400 hover:text-sky-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <SortToggle mode={sortMode} onChange={setSortMode} className="ml-auto" />
        </Panel>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(showAllAssets ? rows : rows.slice(0, 6)).map((a, i) => {
            const rw = readinessWord(a);
            const steps = assetReadiness(a);
            const spare = steps.find((s) => s.key === "spare")!;
            const pct = assetReadinessPct(a);
            const Icon = CATEGORY_ICON[a.category];
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => openAsset(a.id)}
                className={cn(
                  "panel panel-hover flex flex-col gap-2 p-4 px-fadeup text-left",
                  a.id === selected.id && "focus-shelf",
                  `px-fadeup-${Math.min(i + 1, 4)}`
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded border",
                      a.status === "CRITICAL" ? "border-rose-300 bg-rose-50 text-rose-700" : a.status === "OPERATIONAL" || a.status === "STANDBY" ? "border-sky-300 bg-sky-50 text-sky-700" : "border-amber-300 bg-amber-50 text-amber-700"
                    )}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-tele text-[14px] font-bold text-slate-900">{a.id}</span>
                      <span className="block truncate text-[12px] text-slate-500">{a.type}</span>
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]", rw.cls)}>
                    {rw.label}
                  </span>
                </span>

                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-600">
                  <span><span className="font-semibold text-slate-500">Location:</span> {a.location}</span>
                  <span><span className="font-semibold text-slate-500">Last inspection:</span> {a.lastInspection ?? a.lastMaintenance}</span>
                </span>

                <span className="flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[12px] font-bold uppercase tracking-[0.05em]", spare.ok ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50 text-rose-700")}>
                    Spare part: {spare.ok ? "in stock" : "stuck with CG-131"}
                  </span>
                  <span className={cn("font-tele text-[12.5px] font-bold", pct === 100 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-rose-700")}>
                    {pct}% ready
                  </span>
                </span>

                <span className="mt-auto flex items-center justify-between border-t border-slate-200 pt-2 text-[12px] font-bold uppercase tracking-[0.06em] text-sky-700">
                  Repair jobs · spares · what it affects
                  <span>Open details →</span>
                </span>
              </button>
            );
          })}
          {rows.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState what="equipment matches" hint={`Nothing matches “${query}”. Try an asset ID (ATV-021) or a type (snowcat).`} />
            </div>
          )}
          {/* P1-2 — max 6 assets in view; the rest behind View all */}
          {rows.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllAssets((o) => !o)}
              className="rounded-md border border-slate-300 bg-slate-50 py-3 text-[13.5px] font-bold text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-700 sm:col-span-2"
            >
              {showAllAssets ? "Show fewer equipment" : `View all equipment (${rows.length}) →`}
            </button>
          )}
        </div>
      </div>

      {/* detail */}
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-20">
          <AssetDetail asset={selected} />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* INVENTORY tab                                                       */
/* ================================================================== */

/* -------- predictive depletion chart (ported, dark) -------- */
type Mode = "SURGE" | "BASELINE" | "CONSERVATIVE";
const MODE_LABEL: Record<Mode, string> = { SURGE: "Busy", BASELINE: "Normal", CONSERVATIVE: "Careful" };
const MODE_FACTOR: Record<Mode, number> = { SURGE: 1.3, BASELINE: 1, CONSERVATIVE: 0.78 };

function DepletionChart({
  f,
  mode,
  threshold,
  forecast,
}: {
  f: (typeof FORECASTS)[number];
  mode: Mode;
  threshold: number;
  /* STEP 1.3 — the chart annotates THE canonical forecast, so the drawn
     markers can never disagree with the numbers in the cards */
  forecast: ForecastResult;
}) {
  const W = 640;
  const H = 240;
  const PADL = 46;
  const PADR = 16;
  const PADT = 14;
  const PADB = 26;

  const factor = MODE_FACTOR[mode];
  const { series, alertDayFrac, zeroDayFrac } = useMemo(() => {
    const base = f.chart;
    const pts: number[] = [base[0].stock];
    for (let i = 1; i < base.length; i++) {
      const drop = (base[i - 1].stock - base[i].stock) * factor;
      pts.push(Math.max(0, pts[i - 1] - drop));
    }
    return {
      series: pts,
      /* mode-adjusted crossings derived from THE forecast function */
      alertDayFrac: forecast.daysUntilAlert / factor,
      zeroDayFrac: forecast.daysUntilZero / factor,
    };
  }, [f, factor, forecast]);

  const maxY = Math.max(...series) * 1.08;
  const x = (i: number) => PADL + (i / (series.length - 1)) * (W - PADL - PADR);
  const xAt = (day: number) => PADL + (day / (series.length - 1)) * (W - PADL - PADR);
  const y = (v: number) => PADT + (1 - v / maxY) * (H - PADT - PADB);

  const line = series.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(series.length - 1).toFixed(1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label={`${f.name} depletion projection`}>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
        const gy = PADT + g * (H - PADT - PADB);
        return <line key={g} x1={PADL} y1={gy} x2={W - PADR} y2={gy} stroke="#cbd5e1" strokeWidth="1" />;
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <text key={g} x={PADL - 6} y={PADT + g * (H - PADT - PADB) + 3} textAnchor="end" fontSize="9" className="font-tele" fill="#64748b">
          {Math.round(maxY * (1 - g))}
        </text>
      ))}

      {threshold > 0 && threshold < maxY && (
        <g>
          <line x1={PADL} y1={y(threshold)} x2={W - PADR} y2={y(threshold)} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="5 4" />
          <text x={PADL + 4} y={y(threshold) - 5} fontSize="8.5" className="font-tele" fill="#b91c1c" fontWeight="700">
            ALERT LINE {threshold} {f.key === "oxygen" ? "UNITS" : ""}
          </text>
        </g>
      )}

      <path d={area} fill="rgba(59,130,246,0.10)" />
      <path d={line} fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" />

      {/* alert-line crossing marker — from THE forecast, mode-adjusted */}
      {alertDayFrac > 0 && alertDayFrac <= series.length - 1 && (
        <g>
          <circle cx={xAt(alertDayFrac)} cy={y(threshold)} r="5" fill="#ef4444" fillOpacity="0.2" />
          <circle cx={xAt(alertDayFrac)} cy={y(threshold)} r="2.6" fill="#ef4444" />
          <rect x={Math.min(xAt(alertDayFrac) + 6, W - 168)} y={y(threshold) - 22} width="162" height="16" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
          <text x={Math.min(xAt(alertDayFrac) + 12, W - 162)} y={y(threshold) - 10.5} fontSize="8.5" className="font-tele" fill="#b91c1c" fontWeight="700">
            Crosses alert line: day {alertDayFrac.toFixed(1)}
          </text>
        </g>
      )}

      {/* depletion vertical line — the real "runs out" moment (420 ÷ 62 = 6.8) */}
      {zeroDayFrac > 0 && zeroDayFrac <= series.length - 1 && (
        <g>
          <line x1={xAt(zeroDayFrac)} y1={PADT} x2={xAt(zeroDayFrac)} y2={H - PADB} stroke="#b91c1c" strokeWidth="1.2" strokeDasharray="3 3" />
          <rect x={Math.min(xAt(zeroDayFrac) + 4, W - 128)} y={PADT + 2} width="122" height="16" rx="2" fill="#ffffff" stroke="#b91c1c" strokeWidth="0.8" />
          <text x={Math.min(xAt(zeroDayFrac) + 10, W - 122)} y={PADT + 13.5} fontSize="8.5" className="font-tele" fill="#b91c1c" fontWeight="700">
            Runs out: day {zeroDayFrac.toFixed(1)}
          </text>
        </g>
      )}

      {[0, 5, 10].map((d) => {
        if (d >= series.length) return null;
        return (
          <text key={d} x={x(d)} y={H - 8} textAnchor="middle" fontSize="9" className="font-tele" fill="#64748b">
            {d === 0 ? "Today" : `Day ${d}`}
          </text>
        );
      })}
      {alertDayFrac > 0 && alertDayFrac <= series.length - 1 && (
        <text x={xAt(Math.min(alertDayFrac + 2, series.length - 1))} y={H - 8} textAnchor="middle" fontSize="8.5" className="font-tele" fill="#b91c1c" fontWeight="700">
          day {alertDayFrac.toFixed(1)} (alert)
        </text>
      )}
    </svg>
  );
}

/* -------- resupply recommendation modal (ported, dark) -------- */
function ResupplyModal() {
  const open = usePolar((s) => s.resupplyModalOpen);
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const setOpen = usePolar((s) => s.setResupplyModalOpen);
  const item = usePolar((s) => s.resupplyItem);
  const [confirming, setConfirming] = useState(false);
  if (!open) return null;

  const plan = RESUPPLY_PLANS[item];

  return (
    <div ref={trapRef} className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Suggested resupply plan">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="px-fadeup relative w-full max-w-xl overflow-hidden rounded-md border-2 border-sky-300 bg-white shadow-2xl">
        <div className="rail flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <span className="flex items-center gap-2 font-tele text-label-caps font-bold uppercase tracking-[0.14em] text-slate-800">
            <BrainCircuit className="h-4 w-4 text-sky-700" />
            Suggested resupply plan
          </span>
          <PrototypeTag>AI suggests — humans decide</PrototypeTag>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
          <div className="rounded-sm border border-sky-300 bg-sky-50 p-3">
            <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-sky-700">SUGGESTED ACTION</div>
            <p className="mt-1 font-display text-headline-sm leading-snug text-slate-900">
              Resupply {item === "oxygen" ? "oxygen" : plan.item.split(" — ")[0].toLowerCase()} to {plan.destination.split(",")[0]} before the projected threshold is reached.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              ["Item", plan.item],
              ["How much", plan.quantity],
              ["Where", plan.destination],
              ["How to move it", plan.transport],
              ["Why", plan.reason],
              ["When", plan.timing],
            ].map(([k, v]) => (
              <div key={k} className={cn("rounded-sm border border-slate-200 p-2.5", (k === "REASON" || k === "SUGGESTED TIMING") && "sm:col-span-2")}>
                <div className="font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">{k}</div>
                <p className="mt-1 text-body-sm leading-relaxed text-slate-700">{v}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 rounded-sm border border-slate-200 bg-slate-50 p-3">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.2" />
                <path className="text-sky-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="87, 100" strokeLinecap="round" strokeWidth="3.2" />
              </svg>
              <span className="absolute font-tele text-telemetry-sm font-bold text-sky-700">87%</span>
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-slate-600">Demo score (not calibrated)</div>
              <p className="mt-0.5 text-body-sm text-slate-500">
                This is a demo projection. Approving adds the order to the cargo list — a person always signs off first.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <TactButton variant="secondary" onClick={() => { toast.success("Plan downloaded — PX-RS-2026-0914.pdf (demo)"); }}>
            <FileDown className="h-3.5 w-3.5" /> Download plan
          </TactButton>
          <TactButton variant="secondary" onClick={() => setOpen(false)}>Close</TactButton>
          <TactButton onClick={() => setConfirming(true)}>
            <CircleCheck className="h-3.5 w-3.5" /> Submit resupply proposal
          </TactButton>
        </div>

        {/* P0-3 + P1-7 — a proposal, never a bare "Reorder": shows quantity, source, ETA, cost, approver, status */}
        <ConfirmationModal
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={() => {
            toast.success(`Submitted for approval — ${plan.item.split(" — ")[0]} resupply added to the cargo list (demo)`);
            setOpen(false);
          }}
          action="Create resupply proposal"
          target={`${plan.item.split(" — ")[0]} · ${plan.quantity}`}
          priority="MEDIUM"
          consequence="Proposal is queued for the Logistics Officer — nothing is ordered until a person approves it"
          isSimulated
          approver="Logistics Officer"
          confirmLabel="Submit for Approval"
          details={[
            { label: "Quantity", value: plan.quantity },
            { label: "Source", value: "Cape Town Warehouse (primary vendor pool)" },
            { label: "ETA", value: "12 days (vessel) / 2 days (air)" },
            { label: "Cost", value: "₹2.4L (vessel) / ₹8.1L (air)" },
            { label: "Status", value: "Draft — awaiting submission" },
          ]}
          actions={[
            { label: "Save Draft", onPick: () => { toast.info("Draft saved — find it under Supplies · proposals (demo)"); setOpen(false); } },
            { label: "Queue", onPick: () => { toast.info("Proposal queued for the next planning cycle (demo)"); setOpen(false); } },
            { label: "Submit for Approval", primary: true, onPick: () => { toast.success(`Submitted for approval — ${plan.item.split(" — ")[0]} resupply (demo)`); setOpen(false); } },
          ]}
        />
      </div>
    </div>
  );
}

const SITE_RISK: Record<string, { chip: string; border: string; word: string }> = {
  NOMINAL: { chip: "border-emerald-300 bg-emerald-50 text-emerald-700", border: "border-slate-200", word: "OK" },
  CAUTION: { chip: "border-amber-300 bg-amber-50 text-amber-700", border: "border-amber-200", word: "Caution" },
  CRITICAL: { chip: "border-rose-300 bg-rose-50 text-rose-700", border: "border-rose-300", word: "Critical" },
};

function InventoryTab() {
  const openResupply = usePolar((s) => s.openResupply);
  const forecastKey = usePolar((s) => s.forecastKey);
  const setForecastKey = usePolar((s) => s.setForecastKey);
  const focusForecast = usePolar((s) => s.focusForecast);
  const [mode, setMode] = useState<Mode>("SURGE");

  const f = FORECASTS.find((x) => x.key === forecastKey) ?? FORECASTS[0];
  const threshold = f.key === "oxygen" ? 60 : f.key === "food" ? 400 : 60;

  return (
    <div className="space-y-4">
      <ResupplyModal />

      {/* simple list — spec: item, stock level, threshold, status, reorder */}
      <Panel padded={false} className="overflow-hidden">
        <PanelHeader
          index="Stock"
          title="Supplies — what's running low"
          right={<span className="text-[12px] text-slate-500">Stock level · alert line · days left · reorder</span>}
        />
        <div className="divide-y divide-slate-100">
          {INVENTORY.map((it) => {
            const below = it.status === "CRITICAL";
            const watch = it.status === "ATTENTION";
            return (
              <div key={it.key} className="flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-100/60">
                <div className="min-w-[150px] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-slate-900">{it.name}</span>
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.05em]", below ? "border-rose-300 bg-rose-50 text-rose-700" : watch ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700")}>
                      {below ? "Running low" : watch ? "Watching" : "OK"}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-slate-500">{it.note}</div>
                </div>
                <div className="w-40">
                  <Meter value={it.level} tone={below ? "alert" : watch ? "warn" : "ok"} />
                  <div className="mt-1 font-tele text-[12px] uppercase tracking-wider text-slate-500">
                    {it.level}% · {it.stock}
                  </div>
                </div>
                <div className="hidden min-w-[130px] flex-col md:flex">
                  <span className="text-[12px] text-slate-500">Alert line</span>
                  <span className="font-tele text-[12.5px] font-semibold text-slate-700">{it.threshold}</span>
                </div>
                <div className="hidden min-w-[100px] flex-col sm:flex">
                  <span className="text-[12px] text-slate-500">Days left</span>
                  <span className={cn("font-tele text-[13px] font-bold", below ? "text-rose-700" : watch ? "text-amber-700" : "text-slate-800")}>
                    {it.daysLeft} days
                  </span>
                </div>
                <TactButton
                  variant={below ? "primary" : "secondary"}
                  onClick={() => openResupply(it.key)}
                  className="ml-auto"
                >
                  Propose resupply…
                </TactButton>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-amber-50 px-3.5 py-2">
          <span className="flex items-center gap-2 text-body-sm font-medium text-amber-700">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            Oxygen is the tightest supply: at the current rate of use it crosses its alert line in {SUPPLY_FORECASTS.oxygen.daysUntilAlert} days and runs out in {SUPPLY_FORECASTS.oxygen.daysUntilZero}.
          </span>
          <Provenance note="From: demo stock records" />
        </div>
      </Panel>

      {/* site stock cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SITE_STOCK.map((s, i) => {
          const r = SITE_RISK[s.risk];
          return (
            <div key={s.id} className={cn("panel flex flex-col p-3.5", r.border, `px-fadeup-${Math.min(i + 1, 4)}`)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{s.sub}</div>
                  <div className="mt-0.5 font-display text-headline-sm font-semibold text-slate-900">{s.name}</div>
                </div>
                <span className={cn("shrink-0 rounded-sm border px-2 py-0.5 text-[12px] font-semibold", r.chip)}>{r.word}</span>
              </div>
              <div className="mt-2.5 rounded-sm bg-slate-50 px-2 py-1.5">
                <span className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{s.headline.k}</span>
                <div className={cn("font-tele text-telemetry-sm font-bold", s.headline.tone === "alert" ? "text-rose-700" : s.headline.tone === "warn" ? "text-amber-700" : "text-emerald-700")}>
                  {s.headline.v}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {s.cells.map((c) => (
                  <span key={c.k} className="flex flex-col rounded-sm border border-slate-100 px-1.5 py-1">
                    <span className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{c.k}</span>
                    <span className={cn("truncate font-tele text-[11.5px] font-semibold", c.tone === "alert" ? "text-rose-700" : "text-slate-700")}>{c.v}</span>
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2 mt-3">
                <span className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{s.footer.k}</span>
                <span className={cn("font-tele text-telemetry-sm font-bold", s.footer.tone === "alert" ? "text-rose-700" : "text-slate-700")}>{s.footer.v}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* depletion forecast + weather windows */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel padded={false} className={cn("overflow-hidden lg:col-span-8", focusForecast && "ring-2 ring-sky-500")}>
          <div className="p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-500">Supplies at Zone B · -60°C outside</div>
                <h3 className="mt-0.5 font-display text-headline-md text-slate-900">How long will it last?</h3>
              </div>
              <div className="flex overflow-hidden rounded-sm border border-slate-200" role="tablist" aria-label="Usage pace">
                {(Object.keys(MODE_FACTOR) as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "border-l border-slate-200 px-2.5 py-1.5 font-tele text-label-micro font-bold uppercase tracking-wider transition-colors first:border-l-0",
                      mode === m ? "bg-sky-600 text-white" : "bg-transparent text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {FORECASTS.map((ff) => (
                <button
                  key={ff.key}
                  type="button"
                  onClick={() => setForecastKey(ff.key)}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 font-tele text-label-caps font-bold uppercase tracking-wider transition-colors",
                    ff.key === forecastKey
                      ? ff.status === "CRITICAL"
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  {ff.name} · {ff.breach} left
                </button>
              ))}
            </div>

            <div className="mt-2 rounded-sm border border-slate-100 bg-[#eef4fa] px-1 py-2">
              <DepletionChart f={f} mode={mode} threshold={threshold} forecast={SUPPLY_FORECASTS[f.key]} />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
              {[
                ["In stock now", f.stock],
                ["Used per day", f.daily],
                ["Alert line", f.threshold.split(" (")[0]],
                /* STEP 1.4 — both numbers come from THE forecast function,
                   mode-adjusted. ("Runs out" used to show the alert-crossing
                   day — the exact summary-vs-chart conflict the audit flagged.) */
                ["Crosses alert line", `day ${(SUPPLY_FORECASTS[f.key].daysUntilAlert / MODE_FACTOR[mode]).toFixed(1)}`],
                ["Runs out on day", `day ${(SUPPLY_FORECASTS[f.key].daysUntilZero / MODE_FACTOR[mode]).toFixed(1)}`],
              ].map(([k, v]) => (
                <div key={k} className="well px-2.5 py-2">
                  <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{k}</div>
                  <div className="mt-0.5 font-tele text-telemetry-sm font-bold text-slate-800">{v}</div>
                </div>
              ))}
            </div>

            {/* STEP 1.4 — show-your-work: card, chart, alert and tooltip all
                trace back to calculateForecast() */}
            <ForecastDebug
              name={f.name.charAt(0) + f.name.slice(1).toLowerCase()}
              stockLabel={f.stock}
              currentStock={f.key === "oxygen" ? 420 : f.key === "food" ? 1930 : 284}
              burnRatePerDay={f.key === "oxygen" ? 62 : f.key === "food" ? 112 : 9}
              alertThreshold={threshold}
              forecast={SUPPLY_FORECASTS[f.key]}
              defaultOpen={f.key === "oxygen"}
            />

            {/* STEP 12.1 — provenance for the tracked supply value */}
            <DataQualityLine
              value={{
                source: f.key === "oxygen" ? "Maitri store stock count · Zone B draw log" : "Station store stock count",
                capturedAt: scenarioIsoMinusMinutes(f.key === "oxygen" ? 31 : 45),
                confidence: f.key === "oxygen" ? "±2% count error · draw ±18%" : "±2% count error",
                isSimulated: true,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-amber-50 px-3.5 py-2">
            <span className="flex items-center gap-2 text-body-sm font-medium text-amber-700">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              Cold snap: a polar vortex drop to -67.8°C is burning Zone B generator fuel 18% faster than planned.
            </span>
            <span className="rounded-sm border border-sky-300 bg-sky-50 px-2 py-0.5 text-[12px] font-semibold text-sky-700">Demo calculation</span>
          </div>
        </Panel>

        <Panel padded={false} className="overflow-hidden lg:col-span-4">
          <PanelHeader
            index="Routes"
            title="When routes reopen"
            right={<span className="rounded-sm border border-sky-300 bg-sky-50 px-2 py-0.5 text-[12px] font-semibold text-sky-700">Demo weather</span>}
          />
          <div className="space-y-2.5 p-3">
            {WEATHER_WINDOWS.map((w) => (
              <div key={w.route} className="rounded-sm border border-slate-200 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-tele text-telemetry-sm font-bold text-slate-900">{w.route}</span>
                  <span
                    className={cn(
                      "rounded-sm border px-1.5 py-0.5 font-tele text-label-micro font-bold",
                      w.tone === "alert" ? "border-rose-300 bg-rose-50 text-rose-700" : w.tone === "warn" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {w.chip}
                  </span>
                </div>
                <p className="mt-1.5 text-body-sm text-slate-500">
                  Conditions: <span className="font-semibold text-slate-700">{w.conditions}</span>
                </p>
                <div className="mt-1.5 flex items-center justify-between font-tele text-label-micro uppercase tracking-wider text-slate-500">
                  <span>Wind</span>
                  <span className="font-bold text-slate-700">{w.wind}</span>
                </div>
                <p className="mt-1 border-t border-slate-100 pt-1.5 font-tele text-label-micro uppercase tracking-wider text-slate-500">{w.reopen}</p>
              </div>
            ))}
            <button
              type="button"
              onClick={() => toast.success("Weather radar opened — full stream (demo)")}
              className="flex w-full items-center justify-between rounded-sm border border-slate-200 px-2.5 py-2 font-tele text-label-caps font-semibold uppercase tracking-wider text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-700"
            >
              <span className="flex items-center gap-2"><CloudSun className="h-4 w-4" /> Weather satellite</span>
              Full radar →
            </button>
          </div>
        </Panel>
      </div>

      {/* resupply fleet */}
      <Panel padded={false} className="overflow-hidden">
        <PanelHeader
          index="Fleet"
          title="Ships & convoys bringing supplies"
          
        />
        <div className="overflow-x-auto p-1">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 font-tele text-label-micro uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 font-semibold">Vehicle</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Carrying</th>
                <th className="px-3 py-2 font-semibold">Route</th>
                <th className="px-3 py-2 font-semibold">Arrival</th>
                <th className="px-3 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {RESUPPLY_FLEET.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-sky-50/50">
                  <td className="px-3 py-2.5 font-tele text-telemetry-sm font-bold text-sky-700">{r.id}</td>
                  <td className="px-3 py-2.5 text-body-sm text-slate-600">{r.cls}</td>
                  <td className="px-3 py-2.5 text-body-sm text-slate-600">{r.payload}</td>
                  <td className="px-3 py-2.5 text-body-sm text-slate-600">{r.routing}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-sm border px-1.5 py-0.5 font-tele text-label-micro font-bold",
                        r.status.includes("REROUTE") || r.status.includes("STANDBY")
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {r.eta} · {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toast.success(`${r.id} · "${r.action}" accepted (demo)`)}
                      className="rounded-sm border border-sky-600 bg-sky-600 px-2 py-1 font-tele text-label-micro font-bold uppercase text-white transition-colors hover:bg-[#1d4ed8]"
                    >
                      {r.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-3.5 py-2">
          <Ship className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-tele text-label-micro uppercase tracking-wider text-slate-500">
            Positions from ship & convoy trackers (demo)
          </span>
        </div>
      </Panel>
    </div>
  );
}

/* ================================================================== */
/* Merged view                                                         */
/* ================================================================== */

export function InventoryAssetsView({ tab }: { tab: InvTab }) {
  const openResupply = usePolar((s) => s.openResupply);

  return (
    <div className="space-y-4">
      <PageHeader
        kicker={tab === "assets" ? "What's ready and what's broken?" : "What's running low?"}
        title="Equipment & Supplies"
        sub={
          tab === "assets"
            ? "One card per vehicle and instrument, with a 4-step ready-to-use check — where it is, inspection, spare parts, crew. Open a card for repair jobs and what it affects."
            : "Five supplies with alert lines and reorder buttons — the chart shows how long each will last."
        }
        right={
          <>
            <ViewToggle tab={tab} />
            <TactButton variant="secondary" onClick={() => openResupply("oxygen")} icon={<Plus className="h-4 w-4" />}>
              Suggest a resupply
            </TactButton>
          </>
        }
      />
      {tab === "assets" ? <AssetsTab /> : <InventoryTab />}
    </div>
  );
}
