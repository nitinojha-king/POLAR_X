"use client";

import { useState } from "react";
import { usePolar } from "@/lib/polar-store";
import { cn } from "@/lib/utils";
import { PERSONNEL_UNITS, LOCATION_AGE_H, locationAgeTone } from "@/lib/polar-data";
import { Plus, Minus, List, Map as MapIcon, Crosshair } from "lucide-react";

/* ------------------------------------------------------------------ */
/* OpsMap — simple schematic situation map (spec: "Simple > Complex"). */
/* Replaces the geospatial projection widget: stations, field parties, */
/* the resupply vessel and the traverse route — nothing more.          */
/* P1-6: every map gets zoom + list toggle + focus controls, and every */
/* marker carries icon + text label + status + data age (never color   */
/* alone) with aria-labels.                                            */
/* ------------------------------------------------------------------ */

type Station = { key: string; label: string; x: number; y: number; temp: string; wx: string; tone: "ok" | "warn" | "alert"; status: string };

const STATIONS: Station[] = [
  { key: "maitri", label: "MAITRI", x: 268, y: 168, temp: "-24°C", wx: "Clear", tone: "ok", status: "Working well" },
  { key: "bharati", label: "BHARATI", x: 520, y: 232, temp: "-28°C", wx: "Windy", tone: "ok", status: "Working well" },
  { key: "zoneb", label: "ZONE B", x: 196, y: 262, temp: "-42°C", wx: "Blizzard warn", tone: "alert", status: "Blizzard warning" },
];

/* approximate field-party positions on the schematic */
const TEAM_POS: Record<string, { x: number; y: number }> = {
  "unit-07": { x: 276, y: 222 },
  "unit-08": { x: 330, y: 122 },
  "unit-09": { x: 140, y: 298 },
  "unit-10": { x: 470, y: 140 },
};

const VESSEL = { x: 548, y: 64 };

const TONE_DOT = { ok: "bg-emerald-400", warn: "bg-amber-400", alert: "bg-rose-500" } as const;
const TONE_TEXT = { ok: "text-emerald-700", warn: "text-amber-700", alert: "text-rose-700" } as const;

const ZOOM_STEPS = [1, 1.5, 2, 2.6];

/* P1-6 — shared map control cluster */
export function MapControls({
  zoom,
  onZoomIn,
  onZoomOut,
  isList,
  onToggleList,
  focusLabel,
  onFocus,
  className,
}: {
  zoom?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isList: boolean;
  onToggleList: () => void;
  focusLabel?: string;
  onFocus?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("absolute right-2 top-2 flex flex-wrap justify-end gap-1", className)}>
      <button type="button" aria-label="Zoom in" title="Zoom in" onClick={onZoomIn} className="flex h-9 w-9 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:border-sky-400 hover:text-sky-700">
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" aria-label="Zoom out" title="Zoom out" onClick={onZoomOut} className="flex h-9 w-9 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:border-sky-400 hover:text-sky-700">
        <Minus className="h-4 w-4" />
      </button>
      <button type="button" aria-label={isList ? "Show map view" : "Show list view"} title={isList ? "Show map" : "Show list"} onClick={onToggleList} className="flex h-9 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-[12px] font-bold text-slate-700 shadow-sm transition-colors hover:border-sky-400 hover:text-sky-700">
        {isList ? <MapIcon className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
        {isList ? "Map" : "List"}
      </button>
      {focusLabel && onFocus && (
        <button type="button" aria-label={`Focus on ${focusLabel}`} title={`Focus ${focusLabel}`} onClick={onFocus} className="flex h-9 items-center gap-1 rounded border border-sky-300 bg-white px-2 text-[12px] font-bold text-sky-700 shadow-sm transition-colors hover:border-sky-500">
          <Crosshair className="h-3.5 w-3.5" />
          {focusLabel}
        </button>
      )}
      {typeof zoom === "number" && (
        <span className="flex h-9 items-center rounded border border-slate-200 bg-white/90 px-2 text-[12px] font-bold text-slate-500" aria-hidden>
          {zoom.toFixed(1)}×
        </span>
      )}
    </div>
  );
}

export function OpsMap({
  className,
  height = 300,
  showTeams = true,
}: {
  className?: string;
  height?: number;
  showTeams?: boolean;
}) {
  const setView = usePolar((s) => s.setView);
  const openExpedition = usePolar((s) => s.openExpedition);
  /* P1-6 map state */
  const [zoomIdx, setZoomIdx] = useState(0);
  const [center, setCenter] = useState({ x: 320, y: 170 });
  const [isList, setIsList] = useState(false);
  const zoom = ZOOM_STEPS[zoomIdx];

  const zoomIn = () => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  const zoomOut = () => setZoomIdx((i) => Math.max(i - 1, 0));
  const focusAnt09 = () => {
    const pos = TEAM_POS["unit-09"] ?? { x: 140, y: 298 };
    setCenter(pos);
    setZoomIdx(2);
    setIsList(false);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-slate-200 bg-[#e9f1f8]", className)} style={{ height }}>
      {/* P1-6 list view — same data, icon + label + status + age per row */}
      {isList ? (
        <div className="h-full overflow-y-auto p-2" role="list" aria-label="Stations and field parties as a list">
          {[
            ...STATIONS.map((s) => ({
              key: s.key,
              icon: <span className={cn("h-2.5 w-2.5 rotate-45 border", s.tone === "alert" ? "border-rose-500" : "border-emerald-500")} aria-hidden />,
              label: s.label,
              sub: `${s.temp} · ${s.wx}`,
              status: s.status,
              age: "weather 25 min ago",
              tone: s.tone,
            })),
            ...PERSONNEL_UNITS.filter((u) => TEAM_POS[u.id]).map((u) => {
              const tone = locationAgeTone(LOCATION_AGE_H[u.id] ?? 1);
              return {
                key: u.id,
                icon: <span className={cn("h-2.5 w-2.5 rounded-full", u.status === "ATTENTION" ? "bg-amber-400" : "bg-sky-500")} aria-hidden />,
                label: `${u.expeditionCode} field party`,
                sub: `${u.count} people · lead ${u.lead}`,
                status: u.status === "ATTENTION" ? "Needs help — check-in overdue" : "Doing fine",
                age: `position ${LOCATION_AGE_H[u.id] ?? 1}h old`,
                tone,
              };
            }),
            {
              key: "vessel",
              icon: <span className="h-2.5 w-2.5 rounded-full bg-teal-500" aria-hidden />,
              label: "OCEAN QUEST · supply ship",
              sub: "Serving ANT-07 / ANT-10",
              status: "On its way",
              age: "position 12 min ago",
              tone: "ok" as const,
            },
          ].map((r) => (
            <button
              key={r.key}
              type="button"
              role="listitem"
              onClick={() => (r.key === "vessel" ? setView("cargo") : r.key.startsWith("unit") ? openExpedition(r.key === "unit-09" ? "ant-09" : r.key.replace("unit", "ant")) : setView("expeditions"))}
              className="flex w-full items-center gap-3 rounded border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-sky-400"
            >
              {r.icon}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-slate-900">{r.label}</span>
                <span className="block truncate text-[12.5px] text-slate-500">{r.sub} · {r.age}</span>
              </span>
              <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[11.5px] font-bold", r.tone === "alert" ? "border-rose-300 bg-rose-50 text-rose-700" : r.tone === "warn" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700")}>
                {r.status}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <svg viewBox="0 0 640 340" className="h-full w-full" role="img" aria-label="Schematic situation map — Maitri, Bharati and field parties">
          <defs>
            <pattern id="ops-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0 L0 0 0 32" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="640" height="340" fill="url(#ops-grid)" />

          {/* P1-6 zoom/pan transform — the whole scene scales around the focus point */}
          <g transform={`translate(320 170) scale(${zoom}) translate(${-center.x} ${-center.y})`}>
            {/* coast hint */}
            <path
              d="M0 118 Q80 96 160 112 T330 96 T640 60"
              fill="none"
              stroke="#3b82f6"
              strokeOpacity="0.25"
              strokeWidth={1.4 / zoom}
              strokeDasharray="5 4"
            />
            <text x="80" y="52" fontSize={10} letterSpacing="3" className="font-tele" fill="#8298b0" opacity="0.7">
              SOUTHERN OCEAN
            </text>
            <text x="430" y="316" fontSize={10} letterSpacing="3" className="font-tele" fill="#8298b0" opacity="0.5">
              ICE SHELF
            </text>

            {/* traverse route: Maitri → Zone B → Bharati */}
            <polyline
              points="268,168 196,262 520,232"
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.6 / zoom}
              strokeDasharray="6 5"
              className="px-dash"
              opacity="0.55"
            />

            {/* resupply vessel */}
            <g transform={`translate(${VESSEL.x} ${VESSEL.y})`}>
              <circle r="12" fill="none" stroke="#8b5cf6" strokeWidth={1} className="px-ping" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
              <circle r="5" fill="#8b5cf6" />
              <text x="12" y="3" fontSize={10} className="font-tele" fontWeight="700" fill="#6d28d9">
                OCEAN QUEST
              </text>
              <text x="12" y="14" fontSize={9} className="font-tele" fill="#64748b">
                supply ship · on its way · pos 12 min ago
              </text>
            </g>

            {/* stations */}
            {STATIONS.map((s) => (
              <g key={s.key} transform={`translate(${s.x} ${s.y})`}>
                <rect x="-7" y="-7" width="14" height="14" rx="2" transform="rotate(45)" fill="#ffffff" stroke={s.tone === "alert" ? "#ef4444" : "#10b981"} strokeWidth={1.6 / zoom} />
                <circle r="2.4" fill={s.tone === "alert" ? "#ef4444" : "#10b981"} />
                <text y="-16" textAnchor="middle" fontSize={10.5} className="font-tele" fontWeight="700" fill="#0f172a">
                  {s.label} · {s.status}
                </text>
                <text y="26" textAnchor="middle" fontSize={9.5} className="font-tele" fill={s.tone === "alert" ? "#b91c1c" : "#64748b"}>
                  {s.temp} · {s.wx}
                </text>
              </g>
            ))}

            {/* field parties */}
            {showTeams &&
              PERSONNEL_UNITS.map((u) => {
                const pos = TEAM_POS[u.id];
                if (!pos) return null;
                const tone = locationAgeTone(LOCATION_AGE_H[u.id] ?? 1);
                const alert = u.status === "ATTENTION";
                return (
                  <g
                    key={u.id}
                    transform={`translate(${pos.x} ${pos.y})`}
                    className="cursor-pointer"
                    onClick={() => openExpedition(u.expeditionId)}
                    role="button"
                    aria-label={`${u.expeditionCode} field party — ${alert ? "needs help" : "doing fine"} — position ${LOCATION_AGE_H[u.id] ?? 1} hours old — open detail`}
                  >
                    {alert && (
                      <circle r="11" fill="none" stroke="#f59e0b" strokeWidth={1.2 / zoom} className="px-ping" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
                    )}
                    <circle r="5.5" fill={alert ? "#f59e0b" : "#3b82f6"} stroke="#ffffff" strokeWidth={1.5 / zoom} />
                    <text x="9" y="3" fontSize={9.5} className="font-tele" fontWeight="700" fill={alert ? "#92400e" : "#1d4ed8"}>
                      {u.expeditionCode} · {u.count} · {alert ? "NEEDS HELP" : "OK"}
                    </text>
                    <text x="9" y="13" fontSize={9} className="font-tele" fill={TONE_TEXT[tone]}>
                      seen {LOCATION_AGE_H[u.id] ?? 1}h ago
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>
      )}

      {/* P1-6 controls */}
      <MapControls
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        isList={isList}
        onToggleList={() => setIsList((o) => !o)}
        focusLabel="ANT-09"
        onFocus={focusAnt09}
        className={isList ? "top-2" : "top-2"}
      />

      {/* legend */}
      <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-2.5 rounded border border-slate-200 bg-white/90 px-2.5 py-1.5">
        <span className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-600">
          <span className="h-2 w-2 rotate-45 border border-emerald-400 bg-transparent" /> station
        </span>
        <span className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-sky-500" /> team
        </span>
        <span className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> needs help
        </span>
        <span className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-teal-500" /> ship
        </span>
        <button
          type="button"
          onClick={() => setView("expeditions")}
          className="ml-1 text-[10.5px] font-semibold text-sky-700 hover:underline"
        >
          Open plans →
        </button>
      </div>

      <span className="absolute left-2 top-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10.5px] font-semibold text-amber-700">
        Demo positions
      </span>
      <span className={cn("sr-only")}>Schematic map with stations and field parties</span>
    </div>
  );
}

/* Station weather strip with data ages (spec live-map mock) */
export function StationWeatherStrip() {
  const rows = [
    { name: "Maitri", line: "-24°C · Clear · wind 18 kt", age: "30 min", tone: "ok" as const },
    { name: "Bharati", line: "-28°C · Windy · wind 22 kt", age: "45 min", tone: "ok" as const },
    { name: "Zone B", line: "-42°C · Blizzard warning · 52 kt", age: "25 min", tone: "crit" as const },
  ];
  return (
    <div className="grid grid-cols-1 divide-y divide-slate-200 border-t border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {rows.map((s) => (
        <div key={s.name} className="flex min-w-0 flex-col gap-1 px-4 py-2.5">
          <span className="flex items-center gap-2">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", TONE_DOT[s.tone])} />
            <span className="shrink-0 text-[13px] font-semibold text-slate-900">{s.name}</span>
            <span className={cn("truncate text-[12.5px]", s.tone === "crit" ? "font-medium text-rose-700" : "text-slate-500")}>{s.line}</span>
          </span>
          <span className="pl-4 text-[11px] font-semibold text-slate-500">
            Weather from <span className={TONE_TEXT[s.tone]}>{s.age} ago</span> · station sensor (demo)
          </span>
        </div>
      ))}
    </div>
  );
}
