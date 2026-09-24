"use client";

import { useState } from "react";
import {
  Info,
  SlidersHorizontal,
  ChevronDown,
  Pencil,
  Check,
  X,
  History,
  Database,
  Landmark,
  Package2,
  Ship,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RULES as SEED_RULES, type OpRule } from "@/lib/polar-data";
import { getRuleSentence, getRuleBadge, unitSuffix } from "@/lib/rules";
import { PageHeader, Panel, PanelHeader, DataSourceTag, TactButton } from "./ui-bits";
import { PermissionDenied } from "@/components/ui/states";
import { usePolar } from "@/lib/polar-store";

/* ==================================================================
   FEATURE 6 — RULES ENGINE (spec: "Why did this alert trigger?")
   Evidence: report §11 "rules-first maintenance analytics".
   Every alert/status in the platform traces back to one of these
   rules. Thresholds are human-configurable (admin), and every edit
   is versioned and logged to the Black Box.
   ================================================================== */

const DOMAIN_ICON = {
  Personnel: Users,
  Cargo: Ship,
  Inventory: Package2,
  "All domains": Landmark,
} as const;

function bumpVersion(v: string): string {
  const parts = v.replace("v", "").split(".");
  parts[1] = String((parseInt(parts[1] ?? "0", 10) || 0) + 1);
  return `v${parts.join(".")}`;
}

function RuleCard({ rule, onChanged, admin }: { rule: OpRule; onChanged: (r: OpRule) => void; admin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule.threshold.value);
  const [denied, setDenied] = useState(false);
  const Icon = DOMAIN_ICON[rule.domain];
  const setView = usePolar((s) => s.setView);
  const suffix = unitSuffix(rule.threshold.unit);

  const save = () => {
    if (!Number.isFinite(draft) || draft <= 0) {
      toast.error("The limit must be a positive number");
      return;
    }
    const next: OpRule = {
      ...rule,
      threshold: { ...rule.threshold, value: draft },
      versions: [
        {
          v: bumpVersion(rule.versions[0]?.v ?? "v1.0"),
          change: `Limit ${rule.threshold.value} ${suffix} → ${draft} ${suffix}`,
          by: "Cmdr. V. Vance (admin)",
          when: "just now",
        },
        ...rule.versions,
      ],
    };
    onChanged(next);
    setEditing(false);
    toast.success(`${rule.id} limit changed to ${draft} ${suffix} — the change is versioned and saved to the Black Box.`, { duration: 5000 });
  };

  return (
    <div className="panel">
      {/* rule header — the spec's ⓘ expandable pattern */}
      <button type="button" onClick={() => setExpanded((o) => !o)} aria-expanded={expanded} className="flex w-full items-start justify-between gap-4 text-left">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-sky-50 ring-1 ring-sky-300">
            <Icon className="h-3.5 w-3.5 text-sky-700" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-bold tracking-[-0.01em] text-slate-900">
              <span className="font-tele text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">{rule.id}</span>
              {rule.name}
              <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-px font-tele text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                {rule.domain}
              </span>
            </p>
            <p className="mt-0.5 truncate text-[13px] text-slate-500">{rule.description}</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="hidden rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-tele text-[12px] font-bold uppercase tracking-[0.05em] text-emerald-700 sm:inline-flex">
            active
          </span>
          <Info className="h-4 w-4 text-sky-700" />
          <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", expanded && "rotate-180")} />
        </span>
      </button>

      {/* summary line — always visible (3-second scan) — canonical sentence + badge */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2.5">
        <span className="rounded bg-slate-100 px-2 py-1 font-tele text-[12px] font-semibold text-slate-800">
          {getRuleBadge(rule)}
        </span>
        <span className="text-[12.5px] text-slate-800">{getRuleSentence(rule)}</span>
        <span className="truncate text-[12.5px] text-slate-500">→ {rule.action}</span>
        <span className="ml-auto text-[12.5px] font-semibold text-sky-700">{expanded ? "Show less" : "Show more"}</span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* the spec's rule-expansion block — same canonical sentence */}
          <div className="rounded-md border border-sky-300/60 bg-sky-50 p-3 font-tele text-[13px] leading-relaxed text-slate-800">
            <p><span className="font-bold text-sky-700">The rule:</span> {getRuleSentence(rule)}</p>
            <p><span className="font-bold text-slate-500">Real example:</span> {rule.example}</p>
            <p><span className="font-bold text-slate-500">What happens:</span> {rule.action}</p>
            <p>
              <span className="font-bold text-slate-500">The limit:</span> adjustable by an admin (now: {rule.threshold.value} {suffix})
            </p>
          </div>

          {/* used-by links — rules explain the rest of the UI */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-semibold text-slate-500">You’ll see it on:</span>
            {rule.usedBy.map((u) => (
              <span key={u} className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-800">
                {u}
              </span>
            ))}
          </div>

          {/* edit threshold — admin only, versioned, logged; P2-7 shows the denied state for non-admins */}
          <div className="flex flex-wrap items-center gap-2">
            {denied && !admin ? (
              <PermissionDenied what="changing the limit" />
            ) : editing ? (
              <>
                <label className="flex items-center gap-2 rounded border border-sky-400 bg-slate-100 px-2.5 py-1.5">
                  <span className="text-[12px] font-semibold text-slate-500">New limit</span>
                  <input
                    type="number"
                    min={1}
                    max={rule.thresholdMax}
                    value={draft}
                    onChange={(e) => setDraft(Number(e.target.value))}
                    className="w-20 bg-transparent font-tele text-[14px] font-bold text-slate-900 outline-none"
                    aria-label={`New limit for ${rule.id}`}
                  />
                  <span className="text-[12.5px] font-semibold text-slate-500">{suffix}</span>
                </label>
                <button type="button" onClick={save} className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-700 transition-colors hover:border-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Save
                </button>
                <button type="button" onClick={() => { setEditing(false); setDraft(rule.threshold.value); }} className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-3 py-1.5 text-[13px] font-bold text-slate-800 transition-colors hover:border-slate-400">
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => (admin ? setEditing(true) : setDenied(true))}
                className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-800 transition-colors hover:border-sky-400 hover:text-sky-700"
              >
                <Pencil className="h-3.5 w-3.5" /> Change limit <span className="text-[11.5px] font-semibold text-sky-700">(admin only)</span>
              </button>
            )}
          </div>

          {/* version history */}
          <div className="rounded-md border border-slate-200 p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <History className="h-3.5 w-3.5" />
              Change history — every edit is kept
            </p>
            <ol className="mt-2 space-y-1.5 border-l-2 border-slate-300 pl-3">
              {rule.versions.map((v) => (
                <li key={`${rule.id}-${v.v}-${v.when}`} className="relative">
                  <span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-sky-500" aria-hidden />
                  <p className="text-[13px] text-slate-800">
                    <span className="font-tele font-bold text-sky-700">{v.v}</span> · {v.change}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {v.by} · {v.when}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-[12px] italic text-slate-500">Why this rule exists: {rule.evidence}</p>
        </div>
      )}
    </div>
  );
}

export function RulesView() {
  const [rules, setRules] = useState<OpRule[]>(SEED_RULES);
  const setView = usePolar((s) => s.setView);
  /* P2-7 — demo toggle: try the page without admin rights to see the denied state */
  const [admin, setAdmin] = useState(true);

  return (
    <div className="space-y-4">
      <PageHeader
        kicker="Why did this alert trigger?"
        title="Alert Rules"
        sub="Every alert, badge and block in POLAR-X comes from a plain-English rule you can read below. The limits are visible, an admin can adjust them, and every change is recorded. Rules only recommend — people always decide."
        right={
          <>
            <button
              type="button"
              onClick={() => setView("blackbox")}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-3.5 py-2 text-[13px] font-semibold text-slate-800 transition-colors hover:border-sky-400 hover:text-sky-700"
            >
              <Database className="h-3.5 w-3.5" />
              Black Box
            </button>
            <DataSourceTag kind="simulated" label="Simulated rule store" />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <Panel padded={false} className="overflow-hidden">
            <PanelHeader
              index="RULES"
              title="Active rules"
              right={
                <span className="rounded bg-sky-50 px-2 py-0.5 font-tele text-[12px] font-bold uppercase tracking-[0.06em] text-sky-700">
                  {rules.length} rules · all switched on
                </span>
              }
            />
            <div className="space-y-3 p-3">
              {rules.map((r) => (
                <RuleCard key={r.id} rule={r} admin={admin} onChanged={(next) => setRules((rs) => rs.map((x) => (x.id === next.id ? next : x)))} />
              ))}
            </div>
          </Panel>
        </div>

        {/* explainer rail */}
        <div className="space-y-3 lg:col-span-4">
          <Panel>
            <PanelHeader title="How the rules work" />
            <ul className="space-y-2.5 text-[13px] leading-relaxed text-slate-500">
              <li className="flex gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>
                  Every status badge and alert shows <span className="font-semibold text-slate-900">what rule fired, what condition matched, and what action was taken</span> — no unexplained alerts.
                </span>
              </li>
              <li className="flex gap-2">
                <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <span>
                  Limits are <span className="font-semibold text-slate-900">set by people</span> (admin only). Every change is saved as a new version and written to the Black Box.
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>
                  A rule can <span className="font-semibold text-slate-900">suggest, badge or block</span> — but it can never actually move anything by itself. A person always decides.
                </span>
              </li>
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Who’s signed in" />
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 font-tele text-[12.5px] font-bold text-sky-700 ring-1 ring-sky-300">VV</span>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-900">Cmdr. V. Vance</p>
                <p className="text-[12.5px] text-slate-500">Station leader · admin rights {admin ? "on" : "off"} (demo)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdmin((a) => !a)}
              aria-pressed={!admin}
              className="mt-2 w-full rounded border border-slate-300 bg-slate-50 px-2.5 py-2 text-[12.5px] font-bold text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-700"
            >
              {admin ? "Try as station member (no admin rights)" : "Restore admin rights"}
            </button>
            <p className="mt-2.5 text-[12.5px] leading-snug text-slate-500">
              Changes are recorded under the signed-in name. In the real system, a second person would have to approve every change before it takes effect.
            </p>
          </Panel>

          <Panel>
            <PanelHeader title="Where each rule shows up" pilot="info" />
            <ul className="space-y-1.5 text-[12.5px] text-slate-500">
              {rules.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span className="font-tele font-bold text-sky-700">{r.id}</span>
                  <span className="truncate">{r.usedBy[0]}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
