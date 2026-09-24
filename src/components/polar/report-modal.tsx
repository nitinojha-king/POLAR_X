"use client";

import { toast } from "sonner";
import { FileText, Printer, X, Download, CircleCheck } from "lucide-react";
import { EXPEDITIONS, ASSETS, CARGO, INVENTORY, ALERTS, PERSONNEL_UNITS } from "@/lib/polar-data";
import { SeverityBadge } from "@/components/ui/StatusBadge";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { usePolar } from "@/lib/polar-store";
import { cn } from "@/lib/utils";
import { TactButton, PrototypeTag } from "./ui-bits";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="border-b border-slate-200 pb-1 font-tele text-label-caps font-bold uppercase tracking-[0.14em] text-slate-700">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function ReportModal() {
  const open = usePolar((s) => s.reportOpen);
  const trapRef = useFocusTrap<HTMLDivElement>(open);
  const setOpen = usePolar((s) => s.setReportOpen);
  const incidents = usePolar((s) => s.incidents);
  if (!open) return null;

  const openIncidents = incidents.filter((i) => i.status !== "RESOLVED");

  const downloadReport = () => {
    const lines = [
      "POLAR-X MISSION REPORT — PX-MR-2026-0912",
      "Working prototype · simulated data only · SIH 2026",
      "",
      "1. EXPEDITION STATUS",
      ...EXPEDITIONS.map((e) => `   ${e.mission} / ${e.code} — ${e.name} · ${e.status} · ${e.progress}% complete · risk ${e.risk}`),
      "",
      "2. PERSONNEL",
      `   127 on ice · check-in exceptions: ${PERSONNEL_UNITS.filter((u) => u.status === "ATTENTION").map((u) => `${u.expeditionCode} (${u.lastCheckIn})`).join(", ") || "none"}`,
      "",
      "3. ASSETS",
      ...ASSETS.filter((a) => a.status !== "OPERATIONAL").map((a) => `   ${a.id} — ${a.status} · ${a.prediction.basis}`),
      "",
      "4. CARGO",
      ...CARGO.map((c) => `   ${c.id} — ${c.description} · ${c.weight} · ${c.origin} → ${c.destination} · ${c.status}`),
      "",
      "5. INVENTORY",
      ...INVENTORY.map((i) => `   ${i.name} — ${i.stock} · ${i.daysLeft} days left · status ${i.status}`),
      "",
      "6. ALERTS",
      ...ALERTS.map((a) => `   [${a.severity}] ${a.title}`),
      "",
      "7. INCIDENTS",
      ...(openIncidents.length ? openIncidents.map((i) => `   ${i.id} — ${i.title} · ${i.status}`) : ["   No open incidents"]),
      "",
      "8. RECOMMENDATIONS",
      "   - Approve oxygen resupply (120 units) on SY-118 before projected threshold breach (6 days)",
      "   - Inspect ATV-021 before next mission leg — Prototype Risk Scoring: HIGH",
      "   - Expedite CG-131 customs clearance — carries ATV-021 track-link kits",
      "   - Hold Zone B movement until the 18:00 weather update re-opens the window",
      "",
      "9. PENDING ACTIONS",
      "   [ ] Oxygen resupply approval (Inventory & Logistics)",
      "   [ ] ATV-021 work order (Assets)",
      "   [ ] CG-131 delay escalation (Cargo & Shipments)",
      "   [ ] RADAR-009 re-alignment window 13 Sep",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PX-MR-2026-0912.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Mission report downloaded — PX-MR-2026-0912.txt (demo data)");
  };

  return (
    <div ref={trapRef} className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Mission report">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div id="px-report-sheet" className="px-fadeup relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border-2 border-slate-200 bg-white shadow-2xl">
        {/* header */}
        <div className="rail flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-sky-600" />
            <div>
              <div className="font-tele text-label-caps font-bold uppercase tracking-[0.14em] text-slate-800">Mission report · PX-MR-2026-0912</div>
              <div className="font-tele text-label-micro uppercase tracking-wider text-slate-500">A summary of the whole mission — generated from the app’s current state</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrototypeTag>Demo data</PrototypeTag>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close report"
              className="no-print rounded-sm border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:border-sky-400 hover:text-sky-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* 1 expedition status */}
          <Section title="1 · Expedition status">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="font-tele text-label-micro uppercase tracking-wider text-slate-500">
                  <th className="py-1 pr-2 font-semibold">Mission</th>
                  <th className="py-1 pr-2 font-semibold">Unit</th>
                  <th className="py-1 pr-2 font-semibold">Status</th>
                  <th className="py-1 pr-2 font-semibold">Progress</th>
                  <th className="py-1 font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody>
                {EXPEDITIONS.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 text-body-sm">
                    <td className="py-1.5 pr-2 font-tele font-bold text-sky-700">{e.mission}</td>
                    <td className="py-1.5 pr-2 text-slate-800">{e.code} · {e.name.split(" ").slice(0, 2).join(" ")}</td>
                    <td className="py-1.5 pr-2">
                      <span className={cn(
                        "font-tele text-label-micro font-bold",
                        e.status === "ATTENTION" ? "text-amber-700" : "text-emerald-700"
                      )}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 font-tele text-slate-700">{e.progress}%</td>
                    <td className="py-1.5 font-tele text-slate-700">{e.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* 2 personnel */}
          <Section title="2 · Personnel">
            <p className="text-body-sm leading-relaxed text-slate-700">
              127 personnel on ice across 4 units. Check-in exception: ANT-09 Geological Grid team — last check-in 31 min ago (protocol 15 min),
              movement halted pending weather review. All other units inside protocol. No medical evacuations or casualties this period.
            </p>
          </Section>

          {/* 3 assets */}
          <Section title="3 · Assets requiring attention">
            <ul className="space-y-1.5">
              {ASSETS.filter((a) => a.status !== "OPERATIONAL").map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-body-sm text-slate-700">
                  <span className={cn(
                    "mt-0.5 shrink-0 rounded-sm border px-1 py-0.5 font-tele text-label-micro font-bold",
                    a.status === "CRITICAL" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-amber-300 bg-amber-50 text-amber-800"
                  )}>
                    {a.id}
                  </span>
                  {a.prediction.basis}
                </li>
              ))}
            </ul>
          </Section>

          {/* 4 cargo */}
          <Section title="4 · Cargo & shipments">
            <ul className="space-y-1 text-body-sm text-slate-700">
              {CARGO.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2">
                  <span className="font-tele font-bold text-sky-700">{c.id}</span>
                  {c.description} · {c.weight} · {c.origin} → {c.destination}
                  <span className={cn(
                    "rounded-sm border px-1 py-0.5 font-tele text-label-micro font-bold",
                    c.status === "DELAYED" ? "border-rose-300 bg-rose-50 text-rose-700" : c.status === "DELIVERED" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-sky-300 bg-sky-50 text-sky-700"
                  )}>
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {/* 5 inventory */}
          <Section title="5 · Inventory & logistics">
            <ul className="space-y-1 text-body-sm text-slate-700">
              {INVENTORY.map((i) => (
                <li key={i.key} className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "font-tele font-bold",
                    i.status === "CRITICAL" ? "text-rose-700" : i.status === "ATTENTION" ? "text-amber-700" : "text-emerald-700"
                  )}>
                    {i.name.toUpperCase()}
                  </span>
                  {i.stock} · {i.dailyDraw} · {i.daysLeft} days remaining · next: {i.nextResupply}
                </li>
              ))}
            </ul>
          </Section>

          {/* 6 alerts */}
          <Section title="6 · Active alerts">
            <ul className="space-y-1 text-body-sm text-slate-700">
              {ALERTS.map((a) => (
                <li key={a.id}>
                  {/* STEP 6.1 — canonical severity badge */}
                  <span className="mr-1.5 inline-flex items-center gap-1 align-middle">
                    <SeverityBadge severity={a.severity} />
                  </span>
                  {a.title}
                </li>
              ))}
            </ul>
          </Section>

          {/* 7 incidents */}
          <Section title="7 · Incidents">
            {openIncidents.length === 0 ? (
              <p className="flex items-center gap-2 text-body-sm text-slate-700">
                <CircleCheck className="h-3.5 w-3.5 text-emerald-600" /> No open incidents — watchlist nominal.
              </p>
            ) : (
              <ul className="space-y-1 text-body-sm text-slate-700">
                {openIncidents.map((i) => (
                  <li key={i.id}>
                    <span className="font-tele font-bold text-sky-700">{i.id}</span> — {i.title} · status {i.status}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* 8 recommendations */}
          <Section title="8 · AI recommendations (prototype decision support)">
            <ul className="space-y-1.5 text-body-sm text-slate-700">
              <li>• Approve oxygen resupply (120 units) on SY-118 before the projected threshold breach in ~6 days.</li>
              <li>• Inspect ATV-021 before the next mission leg — Prototype Risk Scoring rates failure risk HIGH.</li>
              <li>• Expedite CG-131 customs clearance; it carries the track-link kits needed for the ATV-021 work order.</li>
              <li>• Hold Zone B movement until the 18:00 weather update re-opens the window.</li>
            </ul>
          </Section>

          {/* 9 pending actions */}
          <Section title="9 · Pending actions">
            <ul className="space-y-1 text-body-sm text-slate-700">
              <li>[ ] Oxygen resupply approval — Inventory &amp; Logistics</li>
              <li>[ ] ATV-021 field work order — Assets</li>
              <li>[ ] CG-131 delay escalation — Cargo &amp; Shipments</li>
              <li>[ ] RADAR-009 re-alignment window — 13 Sep</li>
            </ul>
          </Section>

          <p className="mt-5 border-t border-slate-200 pt-3 font-tele text-label-micro uppercase tracking-wider text-slate-500">
            All figures come from the SIH 2026 demo dataset — no live feeds are connected. Anything that would need a future integration is labelled as such.
          </p>
        </div>

        {/* footer actions */}
        <div className="no-print flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <TactButton variant="secondary" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </TactButton>
          <TactButton variant="secondary" onClick={downloadReport}>
            <Download className="h-3.5 w-3.5" /> Download
          </TactButton>
          <TactButton onClick={() => setOpen(false)}>Close</TactButton>
        </div>
      </div>
    </div>
  );
}
