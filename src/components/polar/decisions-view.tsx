"use client";

import { useMemo, useState } from "react";
import { History, Search, GitBranch, Archive, ShieldCheck, RotateCcw } from "lucide-react";
import { usePolar } from "@/lib/polar-store";
import { DECISION_LOG, type DecisionEntry } from "@/lib/polar-data";
import { cn } from "@/lib/utils";
import { Panel, PageHeader, DataSourceTag, TactButton, PrototypeTag } from "./ui-bits";

type Row = DecisionEntry & { session?: boolean; status?: "PROPOSED" | "APPROVED" };

const DOMAIN_CLS: Record<string, string> = {
  Planning: "border-sky-300 bg-sky-50 text-sky-700",
  Cargo: "border-amber-300 bg-amber-50 text-amber-700",
  Inventory: "border-rose-300 bg-rose-50 text-rose-700",
  Personnel: "border-emerald-300 bg-emerald-50 text-emerald-700",
  Emergency: "border-rose-300 bg-rose-50 text-rose-700",
};

const PRESETS = ["reroute", "oxygen", "rest window", "rehearsal", "customs"];

function EntryCard({ d, defaultOpen = false }: { d: Row; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("panel overflow-hidden px-fadeup", d.session && d.status === "PROPOSED" ? "border-sky-500" : d.session ? "border-emerald-300" : "")}>
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-tele text-[13px] font-bold text-sky-700">{d.id}</span>
              <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]", DOMAIN_CLS[d.domain])}>{d.domain}</span>
              {d.session && (
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]",
                  d.status === "PROPOSED" ? "bg-sky-600 text-white" : "bg-emerald-500 text-[#06281c]"
                )}>
                  {d.status} · logged this session
                </span>
              )}
            </div>
            <h3 className="mt-1 text-[15px] font-semibold text-slate-900">{d.title}</h3>
            <div className="mt-0.5 font-tele text-[12px] uppercase tracking-[0.06em] text-slate-500">{d.date}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-600">
              <Archive className="h-3.5 w-3.5" /> Kept forever — never deleted
            </span>
            <DataSourceTag kind="simulated" />
          </div>
        </div>

        <p className="mt-2.5 max-w-4xl text-[13px] leading-relaxed text-slate-700">{d.decision}</p>

        {/* context snapshot — what the situation looked like */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            ["Weather then", d.context.weather],
            ["Equipment then", d.context.assets],
            ["Why it came up", d.context.trigger],
          ].map(([k, v]) => (
            <div key={k} className="well px-2.5 py-2">
              <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">{k}</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-slate-700">{v}</div>
            </div>
          ))}
        </div>

        {/* approval chain */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Approval chain:
          </span>
          {d.approvals.map((a, i) => (
            <span key={a.name} className="flex items-center gap-1.5">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[12px] text-slate-700">
                <b className="text-slate-900">{a.name}</b> · {a.role} — {a.action}
              </span>
              {i < d.approvals.length - 1 && <span className="text-slate-500">→</span>}
            </span>
          ))}
        </div>

        {/* version history + replay */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2.5">
          <span className="flex flex-wrap items-center gap-1.5 font-tele text-[11.5px] uppercase tracking-wider text-slate-500">
            <GitBranch className="h-3.5 w-3.5" />
            {d.versions.map((v, i) => (
              <span key={v.v} className="flex items-center gap-1.5">
                <span className="rounded border border-slate-200 px-1.5 py-0.5 font-bold text-slate-700">{v.v}</span>
                {i < d.versions.length - 1 && <span>→</span>}
              </span>
            ))}
            <span className="normal-case text-slate-500">({d.versions.length} versions · who changed what, when)</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            title="This will NOT re-execute the action — read-only walkthrough of what was decided."
            className="inline-flex items-center gap-1.5 rounded border border-sky-300 bg-sky-50 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.06em] text-sky-700 transition-colors hover:border-sky-500"
          >
            <RotateCcw className={cn("h-3 w-3", open && "animate-spin")} />
            {open ? "Hide the replay" : "View decision replay"}
          </button>
        </div>

        {open && (
          <ol className="mt-2.5 space-y-1.5 border-l-2 border-sky-500/40 pl-3">
            {d.replay.map((r, i) => (
              <li key={i} className="text-[12.5px] leading-snug text-slate-600">
                <span className="mr-1.5 font-tele font-bold text-sky-700">{String(i + 1).padStart(2, "0")}</span>
                {r}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export function DecisionsView() {
  const loggedDecisions = usePolar((s) => s.loggedDecisions);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("ALL");

  const rows: Row[] = useMemo(() => {
    const sessionRows: Row[] = loggedDecisions.map((d) => ({ ...d, session: true, status: d.status }));
    const all = [...sessionRows, ...DECISION_LOG];
    const q = query.trim().toLowerCase();
    return all.filter((d) => {
      const inDomain = domain === "ALL" || d.domain === domain;
      const hay = `${d.id} ${d.title} ${d.decision} ${d.context.trigger} ${d.approvals.map((a) => a.name).join(" ")}`.toLowerCase();
      return inDomain && (!q || hay.includes(q));
    });
  }, [loggedDecisions, query, domain]);

  return (
    <div data-tour="decision-log" className="space-y-4">
      <PageHeader
        kicker="How was this decided, and by whom?"
        title="Past Decisions"
        sub="Every decision keeps who approved it, what the situation was at the time, and how it changed. Records are never deleted — only archived. Try searching “reroute”."
        right={<PrototypeTag>Nothing is ever deleted</PrototypeTag>}
      />

      {/* search & replay */}
      <Panel className="flex flex-wrap items-center gap-4 py-3">
        <label className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search decisions — e.g. “how was cargo rerouted?”"
            className="w-full rounded border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-2 text-body-sm text-slate-800 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "Planning", "Cargo", "Inventory", "Personnel", "Emergency"].map((dm) => (
            <button
              key={dm}
              type="button"
              onClick={() => setDomain(dm)}
              className={cn(
                "rounded border px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors",
                domain === dm ? "border-sky-500 bg-sky-600 text-white" : "border-slate-300 bg-slate-50 text-slate-600 hover:border-sky-400 hover:text-sky-700"
              )}
            >
              {dm}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">Try:</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setQuery(p)}
              className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[12px] text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-700"
            >
              {p}
            </button>
          ))}
        </div>
      </Panel>

      {/* entries */}
      <div className="space-y-4">
        {rows.map((d, i) => (
          <EntryCard key={`${d.id}-${i}`} d={d} defaultOpen={d.session} />
        ))}
        {rows.length === 0 && (
          <Panel className="flex flex-col items-center gap-2 py-10 text-center">
            <History className="h-6 w-6 text-slate-500" />
            <p className="text-body-md text-slate-500">No decisions match “{query}”. Clear the search to see the full archive.</p>
            <TactButton variant="secondary" onClick={() => { setQuery(""); setDomain("ALL"); }}>Clear search</TactButton>
          </Panel>
        )}
      </div>
    </div>
  );
}
