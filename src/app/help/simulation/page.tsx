import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How this simulation works — POLAR-X",
  description: "Full explanation of the POLAR-X SIH 2026 demonstration: what is simulated, what the numbers mean, and how to judge it.",
};

/**
 * STEP 10.2 — the single, consolidated simulation explanation.
 * Every piece of demo copy that used to be scattered across operational
 * screens now lives here. Operational screens carry only the global
 * banner and small amber badges on simulated cards.
 */
export default function SimulationHelpPage() {
  return (
    <div className="mx-auto max-w-3xl bg-white px-4 py-10 text-slate-900 md:py-14">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-amber-700">
        POLAR-X · SIH 2026 · Problem SIH26062
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.01em]">
        How this simulation works
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
        POLAR-X is a working prototype of an Integrated Polar Expedition Logistics and Asset
        Management System. It demonstrates how expedition planning, cargo tracking, inventory,
        personnel movement and emergency response could be managed from one command platform.
        Everything you see runs on <strong>simulated data</strong> — no feed connects to a real
        station, vessel or team.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">What is simulated</h2>
        <ul className="list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-slate-700">
          <li>
            <strong>All data is synthetic.</strong> Expeditions (ANT-07 … ANT-10), consignments
            (CG-104 … CG-131), equipment, people, weather and incidents are demo content written
            for the SIH 2026 scenario.
          </li>
          <li>
            <strong>Every &ldquo;live&rdquo; signal is a stand-in.</strong> Positions, check-ins,
            telemetry, black-box streams and the AI assistant are simulated locally in your browser.
          </li>
          <li>
            <strong>Consequential actions are inert.</strong> Transmitting a message, dispatching a
            rescue vehicle or approving a resupply only updates the demo state — nothing is sent
            anywhere. Every such action is labelled with a yellow SIMULATED badge and shows a
            confirmation dialog with the approver named.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">How to read the numbers</h2>
        <ul className="list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-slate-700">
          <li>
            <strong>Supply forecasts come from one formula.</strong> Days-to-alert and days-to-zero
            are computed from stock ÷ burn rate — open &ldquo;Show the calculation&rdquo; on any
            supply chart to see the exact inputs. If two screens quote oxygen numbers, they quote
            the same calculation.
          </li>
          <li>
            <strong>Confidence values are demo scores.</strong> A &ldquo;Demo confidence: 87%&rdquo;
            is a scripted plausibility signal for judging the interface, not a calibrated
            probability. No safety decision should ever rest on it.
          </li>
          <li>
            <strong>Severity never changes; status does.</strong> Critical / High / Medium /
            Low describe how bad an event is. Open → Acknowledged → In Progress → Resolved /
            Dismissed describe where it is in the workflow. The glossary (ⓘ in the top bar) lists both.
          </li>
          <li>
            <strong>Position and check-in are different signals.</strong> A team&apos;s last GPS fix
            and its last radio check-in age separately — a fresh position with a missed check-in is
            possible and is exactly the case the People page highlights.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-bold">What to evaluate</h2>
        <ul className="list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-slate-700">
          <li>The honest data labelling: provenance, data age and simulated/live badges on critical values.</li>
          <li>The human-in-the-loop pattern: the system proposes, a named human approves, the decision is logged and replayable.</li>
          <li>The offline-first queue: cut the connection (top bar) and watch updates wait, then sync in priority order.</li>
          <li>The reconciliation: emergency counters match the incident cards; the oxygen forecast matches the chart, alert and card.</li>
        </ul>
      </section>

      <section className="mt-8 rounded-md border border-amber-300 bg-amber-50 p-4">
        <h2 className="text-[15px] font-bold text-amber-900">Disclaimer</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-amber-900/90">
          This is a simulated demonstration built for Smart India Hackathon 2026. No data comes from
          real operations. Confidence values are demo scores, not calibrated safety probabilities.
          Nothing here should be used for real-world polar operations.
        </p>
      </section>

      <p className="mt-8 text-[13.5px]">
        <a href="/" className="font-semibold text-sky-700 hover:underline">
          ← Back to POLAR-X
        </a>
      </p>
    </div>
  );
}
