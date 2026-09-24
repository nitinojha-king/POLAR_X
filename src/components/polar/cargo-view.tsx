"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Ship,
  Package,
  FileDown,
  ArrowRight,
  X,
  Search,
  Scale,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import {
  CARGO,
  CARGO_CUSTODY,
  PAYLOAD_LIMIT_KG,
  weightKgOf,
  CG131_OPPORTUNITY,
  validateTimeline,
  type CargoConsignment,
} from "@/lib/polar-data";
import { getNow, isSameDay, formatRelativeTime, formatAbsoluteTime } from "@/lib/clock";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { usePolar } from "@/lib/polar-store";
import { SortToggle, parseRelativeAge, type SortMode } from "@/components/DataAge";
import { EmptyState } from "@/components/ui/states";
import { DataQualityLine } from "@/components/ui/DataQualityLine";
import { scenarioIsoMinusMinutes } from "@/lib/clock";
import { cn } from "@/lib/utils";
import {
  Panel,
  PanelHeader,
  PageHeader,
  Provenance,
  TactButton,
  CargoStatusChip,
  CustodyChain,
  DataAgeBadge,
  DataSourceTag,
} from "./ui-bits";

/* per-consignment presentation facts (kept next to the view on purpose —
   the core record lives in polar-data.ts) */
const CARGO_VIEW: Record<string, { location: string; nextLeg: string; age: string; ageTone: "ok" | "warn" | "crit" }> = {
  "CG-104": { location: "Vessel Ocean Quest · ice-edge transit", nextLeg: "Boat transfer to Maitri — 1–2 day weather window", age: "4 h", ageTone: "warn" },
  "CG-118": { location: "Cape Town Port · hold 2", nextLeg: "Vessel to Bharati — 10–12 days after load", age: "25 min", ageTone: "ok" },
  "CG-127": { location: "Zone B camp · signed off", nextLeg: "Delivered — no further legs", age: "signed 11:20", ageTone: "ok" },
  "CG-131": { location: "Cape Town Port · customs hold", nextLeg: "Awaiting release → vessel to Maitri — 10–12 days", age: "6 h", ageTone: "crit" },
};

const PRIORITY_CLS: Record<string, string> = {
  CRITICAL: "border-rose-300 bg-rose-50 text-rose-700",
  HIGH: "border-amber-300 bg-amber-50 text-amber-700",
  NORMAL: "border-sky-300 bg-sky-50 text-sky-700",
};

/* ---------------- summary strip (exception-based) ---------------- */

function ExceptionStrip({ delayed, moving }: { delayed: number; moving: number }) {
  return (
    <section aria-label="Cargo summary" className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[
        { k: "Held up", v: String(delayed), sub: "CG-131 waiting at port", tone: "text-rose-700" },
        { k: "On the move", v: String(moving), sub: "Ship + convoy legs", tone: "text-sky-700" },
        { k: "Shipments", v: String(CARGO.length), sub: "This planning cycle", tone: "text-slate-800" },
        { k: "Weight space left", v: `${PAYLOAD_LIMIT_KG - 1620 > 0 ? PAYLOAD_LIMIT_KG - 1620 : 0} kg`, sub: "On the ship leg · default load", tone: "text-emerald-700" },
      ].map((c, i) => (
        <div key={c.k} className={cn("panel flex flex-col gap-1 p-4", `px-fadeup-${Math.min(i + 1, 4)}`)}>
          <span className="text-[12.5px] font-semibold text-slate-500">{c.k}</span>
          <span className={cn("font-tele text-telemetry-lg font-bold", c.tone)}>{c.v}</span>
          <span className="text-[11.5px] text-slate-500">{c.sub}</span>
        </div>
      ))}
    </section>
  );
}

/* ---------------- payload limit checker (spec) ---------------- */

function PayloadChecker() {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({
    "CG-104": true,
    "CG-118": true,
    "CG-131": false,
  });

  const vesselLeg = CARGO.filter((c) => c.id !== "CG-127");
  const used = vesselLeg.reduce((acc, c) => acc + (loaded[c.id] ? weightKgOf(c.weight) : 0), 0);
  const over = used > PAYLOAD_LIMIT_KG;
  const pct = Math.min(100, (used / PAYLOAD_LIMIT_KG) * 100);

  return (
    <Panel padded={false} className="overflow-hidden" data-tour="payload-check">
      <PanelHeader
        index="Why? Alert rule R-04"
        title="Weight check — ship leg"
        right={<DataSourceTag kind="simulated" label="You can see how this works" />}
      />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={cn("font-tele text-[15px] font-bold", over ? "text-rose-700" : "text-slate-900")}>
            {used.toLocaleString()} kg / {PAYLOAD_LIMIT_KG.toLocaleString()} kg used
          </span>
          <span className={cn("rounded border px-2 py-1 text-[12px] font-semibold", over ? "border-rose-300 bg-rose-50 text-rose-700" : "border-emerald-300 bg-emerald-50 text-emerald-700")}>
            {over ? "Too heavy — remove something" : "OK — within the limit"}
          </span>
        </div>

        {/* bar with red zone */}
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`Payload ${used} of ${PAYLOAD_LIMIT_KG} kg`}>
          <div className="absolute inset-y-0 left-[80%] right-0 bg-rose-500/25" aria-hidden />
          <div
            className={cn("h-full rounded-full transition-all duration-500", over ? "bg-rose-500" : used > 80 ? "bg-amber-500" : "bg-emerald-500")}
            style={{ width: `${pct}%` }}
          />
          <span className="absolute inset-y-0 left-[80%] w-px bg-rose-400" aria-hidden />
        </div>
        <div className="flex justify-between text-[11.5px] font-medium text-slate-500">
          <span>0</span>
          <span className="text-rose-700">danger zone (from 80%)</span>
          <span>{PAYLOAD_LIMIT_KG.toLocaleString()} kg</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {vesselLeg.map((c) => (
            <button
              key={c.id}
              type="button"
              role="switch"
              aria-checked={!!loaded[c.id]}
              onClick={() => setLoaded((s) => ({ ...s, [c.id]: !s[c.id] }))}
              className={cn(
                "inline-flex items-center gap-2 rounded border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                loaded[c.id] ? "border-sky-500 bg-sky-100 text-sky-700" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400"
              )}
            >
              <span className={cn("h-3.5 w-3.5 rounded-sm border", loaded[c.id] ? "border-sky-400 bg-sky-500" : "border-slate-400")} />
              {c.id} · {c.weight}
            </button>
          ))}
        </div>
        <p className="text-[13px] leading-relaxed text-slate-500">
          The rule: one ship trip can carry at most {PAYLOAD_LIMIT_KG.toLocaleString()} kg of mission cargo — that is the safe load limit of the deck.
          The app checks this before anything is loaded, the same way the resupply planner does it automatically.
        </p>
      </div>
    </Panel>
  );
}

/* ---------------- next feasible opportunity (spec feature B) -------- */

function NextOpportunity() {
  const recordDecision = usePolar((s) => s.recordDecision);
  const setView = usePolar((s) => s.setView);
  const [selected, setSelected] = useState<string | null>(null);

  const choose = (optionId: string) => {
    const opt = CG131_OPPORTUNITY.options.find((o) => o.id === optionId);
    if (!opt) return;
    setSelected(optionId);
    recordDecision({
      id: `DEC-1060`,
      date: "12 Sep 2026 · just now",
      title: `CG-131 recovery route: ${opt.label}`,
      domain: "Cargo",
      decision: `${opt.detail}. Trade-off accepted: ${opt.cost} — ${opt.impact}`,
      context: {
        weather: "Katabatic front near Zone B; window reassessed at 18:00",
        assets: "ATV-021 awaiting track-link kits carried by CG-131",
        trigger: "Customs hold at Cape Town — 36 h and counting",
      },
      approvals: [{ name: "Cmdr. V. Vance", role: "Station Leader · Ops", action: "Selected alternate route" }],
      versions: [{ v: "v1.0", who: "Cmdr. V. Vance", change: "Alternate route selected in Cargo Tracking", time: "12 Sep · now" }],
      retention: "ACTIVE",
      replay: [`${opt.label} — ${opt.eta}`, `Impact: ${opt.impact}`, `Cost: ${opt.cost}`],
      status: "PROPOSED",
    });
    toast.success("Alternate route recorded as a PROPOSED decision — review it in the Decision Log", { duration: 5000 });
  };

  return (
    <Panel padded={false} className="overflow-hidden border-amber-300">
      <PanelHeader
        index="Delay detected"
        title={`How can we get it moving? — ${CG131_OPPORTUNITY.cargoId}`}
        pilot="warn"
        right={<DataSourceTag kind="simulated" label="You choose — the system suggests" />}
      />
      <div className="space-y-3 p-4">
        <p className="text-[13px] leading-relaxed text-slate-700">{CG131_OPPORTUNITY.problem}</p>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {CG131_OPPORTUNITY.options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o.id)}
              aria-pressed={selected === o.id}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                selected === o.id ? "border-sky-500 bg-sky-100 focus-shelf" : "border-slate-300 bg-slate-50 hover:border-sky-400"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-semibold text-slate-900">{o.label}</span>
                {o.recommended && (
                  <span className="rounded bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-[#06281c]">
                    System's pick
                  </span>
                )}
              </span>
              <span className="mt-1 block text-[12.5px] text-slate-600">{o.detail}</span>
              <span className="mt-2 grid grid-cols-2 gap-1.5 text-[12px]">
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">Cost: <b className="text-amber-700">{o.cost}</b></span>
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">ETA: <b className="text-sky-700">{o.eta}</b></span>
              </span>
              <span className="mt-1.5 block text-[12.5px] leading-snug text-slate-500">{o.impact}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-2xl text-[12.5px] leading-relaxed text-slate-500">{CG131_OPPORTUNITY.tradeOff}</p>
          {selected && (
            <TactButton variant="secondary" onClick={() => setView("decisions")}>
              <GitBranch className="h-3.5 w-3.5" /> See it in Past decisions
            </TactButton>
          )}
        </div>
        <p className="border-t border-slate-200 pt-2.5 text-[12.5px] font-semibold text-slate-500">{CG131_OPPORTUNITY.rule}</p>
      </div>
    </Panel>
  );
}

/* ---------------- detail drawer (progressive disclosure) ------------- */

function CargoDrawer({ cargo }: { cargo: CargoConsignment }) {
  const clearCargo = usePolar((s) => s.clearCargo);
  const openExpedition = usePolar((s) => s.openExpedition);
  const openResupply = usePolar((s) => s.openResupply);
  const setView = usePolar((s) => s.setView);

  const expeditionId = cargo.assignedExpedition ? `ant-${cargo.assignedExpedition.split("-")[1].toLowerCase()}` : null;
  const view = CARGO_VIEW[cargo.id];
  const custody = CARGO_CUSTODY[cargo.id] ?? [];

  return (
    <div ref={useFocusTrap<HTMLDivElement>(true)} className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Shipment ${cargo.id} details`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={clearCargo} />
      <aside className="px-drawer absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl">
        {/* header */}
        <div className="rail flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <div className="font-tele text-label-micro uppercase tracking-[0.16em] text-slate-500">Cargo handover status // {cargo.id}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-headline-sm font-semibold text-slate-900">{cargo.description}</h2>
              <CargoStatusChip status={cargo.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={clearCargo}
            aria-label="Close details"
            className="rounded-sm border border-slate-200 bg-slate-50 p-1.5 text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
          {/* route facts */}
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Weight", cargo.weight],
              ["Carrier", cargo.carrier],
              ["From", cargo.origin],
              ["To", cargo.destination],
              ["Priority", cargo.priority],
              ["Arriving", cargo.eta],
            ].map(([k, v]) => (
              <div key={k} className="well px-2.5 py-2">
                <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{k}</div>
                <div className="mt-0.5 font-tele text-telemetry-sm font-semibold text-slate-800">{v}</div>
                {k === "Arriving" && cargo.etaIso && (
                  <div className="mt-0.5 text-[11px] font-medium text-slate-500">{formatRelativeTime(cargo.etaIso)}</div>
                )}
              </div>
            ))}
          </div>

          {/* STEP 12.1 — provenance for the consignment weight (a critical value) */}
          <DataQualityLine
            value={{
              source: cargo.id === "CG-131" ? "Cape Town port manifest · customs hold record" : "Port manifest · signed at loading",
              capturedAt: scenarioIsoMinusMinutes(cargo.id === "CG-118" ? 25 : cargo.id === "CG-131" ? 360 : 240),
              confidence: "±0.5 kg scale tolerance",
              isSimulated: true,
            }}
          />

          {/* custody chain */}
          <div className="rounded-sm border border-slate-200 p-3">
            <span className="text-[13px] font-semibold text-slate-700">Handover trail — who signed for it</span>
            <div className="mt-3">
              <CustodyChain steps={custody} />
            </div>
          </div>

          {/* status timeline: Prepared → Loaded → In Transit → Arrived
              STEP 4.2 — every dated step shows dual time (relative + absolute)
              and a PAST / TODAY / FUTURE status; today's steps get a ring */}
          <div className="rounded-sm border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-700">Status timeline</span>
              <DataSourceTag kind="simulated" label="Working prototype" />
            </div>
            <div className="mt-3 flex items-start">
              {cargo.timeline.map((t, i) => {
                const isLast = i === cargo.timeline.length - 1;
                const eventDate = t.timestamp ? new Date(t.timestamp) : null;
                const now = getNow();
                const whenStatus = !eventDate
                  ? null
                  : eventDate < now
                    ? "PAST"
                    : isSameDay(eventDate, now)
                      ? "TODAY"
                      : "FUTURE";
                return (
                  <div key={t.step} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
                    {!isLast && (
                      <span
                        className={cn("absolute left-1/2 top-[9px] h-0.5 w-full", t.done ? "bg-emerald-500" : "bg-slate-300")}
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 bg-white font-tele text-[10.5px] font-bold",
                        t.done && !t.current
                          ? "border-emerald-500 bg-emerald-500 text-[#06281c]"
                          : t.current
                            ? "border-sky-500 text-sky-700 ring-4 ring-sky-500/25"
                            : "border-slate-300 text-slate-500"
                      )}
                    >
                      {t.done && !t.current ? "✓" : ""}
                    </span>
                    <span className={cn("mt-1.5 font-tele text-label-micro uppercase tracking-wider", t.current ? "font-bold text-sky-700" : t.done ? "text-slate-700" : "text-slate-500")}>
                      {t.step}
                    </span>
                    {t.timestamp ? (
                      <span
                        className={cn(
                          "mt-0.5 rounded border px-1 font-tele text-[10.5px] uppercase tracking-wide",
                          whenStatus === "TODAY" ? "border-amber-400 bg-amber-50 text-amber-700 ring-1 ring-amber-400" : "border-transparent text-slate-500"
                        )}
                      >
                        <span title={formatAbsoluteTime(t.timestamp)}>{formatRelativeTime(t.timestamp)}</span>
                        <span className="ml-1 font-bold">{whenStatus}</span>
                      </span>
                    ) : (
                      t.time && (
                        <span className="mt-0.5 font-tele text-[10.5px] uppercase tracking-wide text-slate-500">{t.time}</span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
            {(() => {
              const issues = validateTimeline([cargo]);
              return issues.length > 0 ? (
                <p role="alert" className="mt-2 rounded border border-rose-300 bg-rose-50 px-2 py-1 text-[12px] font-semibold text-rose-700">
                  Date check: {issues.join(" · ")}
                </p>
              ) : null;
            })()}
          </div>

          {/* manifest */}
          <div className="rounded-sm border border-slate-200 p-3">
            <span className="text-[13px] font-semibold text-slate-700">Packing list · {cargo.manifest.length} items</span>
            <div className="mt-2 divide-y divide-slate-100">
              {cargo.manifest.map((m) => (
                <div key={m.item} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="flex items-center gap-2 text-body-sm text-slate-600">
                    <Package className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    {m.item}
                  </span>
                  <span className="shrink-0 font-tele text-telemetry-sm font-semibold text-slate-800">{m.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* assigned expedition */}
          <div className="rounded-sm border border-slate-200 p-3">
            <span className="text-[13px] font-semibold text-slate-700">Delivering to team</span>
            {cargo.assignedExpedition ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-sm bg-slate-50 px-2.5 py-2">
                <span className="font-tele text-telemetry-sm text-slate-700">
                  <span className="font-bold text-sky-700">{cargo.assignedExpedition}</span> · Mission {cargo.assignedMission}
                </span>
                {expeditionId && (
                  <TactButton
                    variant="secondary"
                    onClick={() => {
                      clearCargo();
                      openExpedition(expeditionId);
                    }}
                  >
                    Open plan <ArrowRight className="h-3.5 w-3.5" />
                  </TactButton>
                )}
              </div>
            ) : (
              <p className="mt-1.5 text-body-sm text-slate-500">Station stock — not tied to a field team.</p>
            )}
          </div>

          {/* note */}
          {cargo.note && (
            <div className={cn(
              "rounded-sm border p-3 text-body-sm leading-relaxed",
              cargo.status === "DELAYED" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-600"
            )}>
              {cargo.note}
            </div>
          )}

          {/* linked actions — cargo ↔ inventory ↔ expedition */}
          <div className="flex flex-wrap gap-2">
            {cargo.id === "CG-131" && (
              <TactButton
                variant="amber"
                onClick={() => {
                  clearCargo();
                  openResupply("spare");
                  setView("logistics");
                }}
              >
                See supply impact <ArrowRight className="h-3.5 w-3.5" />
              </TactButton>
            )}
            <TactButton variant="secondary" onClick={() => toast.success(`Packing list ${cargo.id} downloaded — PX-CG-${cargo.id.split("-")[1]}.pdf (demo)`)}>
              <FileDown className="h-3.5 w-3.5" /> Download packing list
            </TactButton>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2">
          <Provenance note="From: demo port & journey records" />
        </div>
      </aside>
    </div>
  );
}

/* ---------------- main view ---------------- */

export function CargoView() {
  const openCargo = usePolar((s) => s.openCargo);
  const selectedCargoId = usePolar((s) => s.selectedCargoId);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  /* P2-2 — sort by most urgent / most stale */
  const [sortMode, setSortMode] = useState<SortMode>("urgent");
  /* P1-2 — cards collapsed by default */
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpandedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = CARGO.filter((c) => {
      const inStatus = statusFilter === "ALL" || c.status === statusFilter;
      const inQuery = !q || `${c.id} ${c.description} ${c.origin} ${c.destination}`.toLowerCase().includes(q);
      return inStatus && inQuery;
    });
    /* P2-2 — most urgent: priority first, freshest data inside the tier;
       most stale: oldest data age first */
    const prio: Record<string, number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
    const ageOf = (c: (typeof CARGO)[number]) => {
      const view = CARGO_VIEW[c.id];
      const m = view ? parseRelativeAge(view.age) : null;
      return m ?? 0;
    };
    return [...filtered].sort((a, b) => {
      if (sortMode === "stale") return ageOf(b) - ageOf(a);
      const p = (prio[a.priority] ?? 3) - (prio[b.priority] ?? 3);
      if (p !== 0) return p;
      return ageOf(b) - ageOf(a);
    });
  }, [query, statusFilter, sortMode]);

  const selected = CARGO.find((c) => c.id === selectedCargoId) ?? null;
  const delayed = CARGO.filter((c) => c.status === "DELAYED").length;
  const moving = CARGO.filter((c) => c.status !== "DELAYED" && c.status !== "DELIVERED").length;

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="Where is my cargo and can it move?"
        title="Cargo & Shipments"
        sub="Who has each package now, whether it can still move, and what's held up — one card per shipment."
        right={<Provenance note="From: demo port & journey records" />}
      />

      <ExceptionStrip delayed={delayed} moving={moving} />

      {/* search + filter */}
      <Panel className="flex flex-wrap items-center gap-4 py-3">
        <label className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cargo by ID, item or route…"
            className="w-full rounded border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2 text-body-sm text-slate-800 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "ALL", label: "All" },
            { v: "IN TRANSIT", label: "On its way" },
            { v: "LOADING", label: "Loading" },
            { v: "DELAYED", label: "Held up" },
            { v: "DELIVERED", label: "Delivered" },
          ].map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setStatusFilter(f.v)}
              className={cn(
                "rounded border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                statusFilter === f.v ? "border-sky-500 bg-sky-600 text-white" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-sky-400 hover:text-sky-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SortToggle mode={sortMode} onChange={setSortMode} className="ml-auto" />
      </Panel>

      {delayed > 0 && <NextOpportunity />}

      <PayloadChecker />

      {/* cargo cards — P1-2: collapsed by default (name, weight, location, status); details behind "View more" */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {rows.map((c, i) => {
          const view = CARGO_VIEW[c.id];
          const custody = CARGO_CUSTODY[c.id] ?? [];
          const okPayload = weightKgOf(c.weight) <= PAYLOAD_LIMIT_KG;
          const expanded = expandedIds.has(c.id);
          return (
            <div key={c.id} className={cn("panel flex flex-col gap-4 p-4 px-fadeup", c.status === "DELAYED" && "border-rose-300", `px-fadeup-${Math.min(i + 1, 4)}`)}>
              {/* line 1 — identity (always visible) */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-tele text-[15px] font-bold text-sky-700">{c.id}</span>
                    <span className="text-[14px] font-semibold text-slate-900">{c.description}</span>
                    <span className={cn("rounded border px-2 py-0.5 text-[11px] font-semibold", PRIORITY_CLS[c.priority])}>
                      {c.priority === "CRITICAL" ? "Urgent" : c.priority === "HIGH" ? "Important" : "Routine"}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[13px] text-slate-500">
                    <span className="font-semibold text-slate-600">Now at: </span>{view.location}
                  </div>
                </div>
                <CargoStatusChip status={c.status} />
              </div>

              {/* always visible — weight check */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] font-semibold", okPayload ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50 text-rose-700")}>
                  <Scale className="h-3.5 w-3.5" />
                  Weight {c.weight} — {okPayload ? "fits the ship" : "too heavy"}
                </span>
                <span className="ml-auto">
                  <DataSourceTag kind="simulated" />
                </span>
              </div>

              {expanded && (
                <>
                  {/* next leg */}
                  <div className="flex items-start gap-2 rounded border border-slate-200 bg-slate-50 px-2.5 py-2 text-[13px] text-slate-700">
                    <Ship className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-700" />
                    <span><span className="font-semibold text-slate-600">Next move: </span>{view.nextLeg}</span>
                  </div>

                  {/* handover trail */}
                  <div>
                    <div className="mb-1.5 text-[12px] font-semibold text-slate-500">Handover trail — who has it now</div>
                    <CustodyChain steps={custody} />
                  </div>

                  {/* data age */}
                  <div className="flex flex-wrap items-center gap-2">
                    <DataAgeBadge age={view.age} tone={view.ageTone} label="Position updated" />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                    <span className="text-[12.5px] text-slate-500">Open for packing list, sign-offs and what it affects</span>
                    <TactButton variant="secondary" onClick={() => openCargo(c.id)}>
                      View details <ArrowRight className="h-3.5 w-3.5" />
                    </TactButton>
                  </div>
                </>
              )}

              {/* P1-2 — View more toggle */}
              <button
                type="button"
                onClick={() => toggleExpanded(c.id)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-slate-300 bg-slate-50 py-2 text-[13px] font-bold text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-700"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                {expanded ? "View less" : "View more"}
              </button>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="sm:col-span-1 xl:col-span-2">
            <EmptyState
              what="shipments match"
              hint={`Nothing matches “${query}”. Try an expedition code (ANT-09), a shipment ID (CG-104) or clear the filter.`}
            />
          </div>
        )}
      </div>

      {selected && <CargoDrawer cargo={selected} />}
    </div>
  );
}
