import Link from "next/link";
import {
  Radar,
  Ship,
  ShieldCheck,
  WifiOff,
  Siren,
  Database,
  ArrowRight,
  ChevronDown,
  Check,
} from "lucide-react";

/* POLAR-X landing — states the values the platform gives an expedition
   team, in plain everyday words, then hands over to the app at /app. */

function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M20 4 L34 30 L6 30 Z" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 13 L26 26 L14 26 Z" fill="#3b82f6" />
      <circle cx="20" cy="33.4" r="1.8" fill="#10b981" />
    </svg>
  );
}

const VALUES = [
  {
    icon: Radar,
    title: "One screen, one answer",
    body: "The home screen answers a single question: is the expedition on track? One big readiness number, the few things that need a decision today — and nothing else fighting for your eyes.",
  },
  {
    icon: Ship,
    title: "Know where every crate is",
    body: "Follow each shipment hand to hand — Goa, Cape Town, the supply ship, the station. A late handover turns red on its own, and a simple weight check tells you before a trip whether the load will actually move.",
  },
  {
    icon: ShieldCheck,
    title: "Numbers you can trust",
    body: "Every figure carries a small tag showing where it came from and how old it is. Demo data is always labelled as demo — nobody can mistake it for a live feed.",
  },
  {
    icon: WifiOff,
    title: "Keeps working offline",
    body: "Antarctic internet drops — sometimes for hours. POLAR-X keeps recording, queues every update on the device, and sends it all when the link returns, most urgent things first.",
  },
  {
    icon: Siren,
    title: "Faster, calmer emergencies",
    body: "A six-step timeline walks the team from first alert all the way to the review meeting. Practice drills, the nearest rescue vehicle and a handover pack for the next shift are one tap away.",
  },
  {
    icon: Database,
    title: "Nothing is ever lost",
    body: "Like an aircraft's black box, every action and decision is sealed with a digital fingerprint. Any choice made on the ice can be replayed later, checked, and learned from.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Glance — three seconds",
    body: "The overview shows one big number for mission readiness and a short list of what needs you today. Green, yellow, red — that's all the colour language you need.",
  },
  {
    n: "2",
    title: "Tap anything red",
    body: "Every card opens plain-words details: what happened, where the data came from, and what the system suggests. No manuals, no jargon.",
  },
  {
    n: "3",
    title: "You decide — it never acts alone",
    body: "The system can suggest a repair, a route or a reorder. But a person always presses the final button, and that choice is written into the record.",
  },
];

const TRUST = [
  "Built for Maitri & Bharati stations",
  "People approve every action",
  "Every number shows its source and age",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------- top bar ---------- */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="flex flex-col">
              <span className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-slate-900">POLAR-X</span>
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Polar expedition operations
              </span>
            </div>
          </div>
          <Link
            href="/app"
            className="hidden items-center gap-1.5 rounded border border-slate-300 bg-slate-100 px-4 py-2 text-[14px] font-semibold text-slate-800 transition-colors hover:border-sky-400 hover:text-sky-700 sm:inline-flex"
          >
            Open the app
          </Link>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="grid-bg border-b border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center md:px-6 md:py-28">
          <span className="px-fadeup inline-flex items-center gap-2 rounded border border-sky-200 bg-sky-50 px-3 py-1.5 text-[12.5px] font-semibold text-sky-700">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            Smart India Hackathon 2026 · Problem SIH26062
          </span>
          <h1 className="px-fadeup-1 mt-6 max-w-3xl font-display text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[56px]">
            The whole expedition, on one calm screen.
          </h1>
          <p className="px-fadeup-2 mt-5 max-w-2xl text-[17px] leading-7 text-slate-600 md:text-[19px] md:leading-8">
            POLAR-X puts cargo, supplies, people and emergencies in one place for
            India&apos;s Antarctic stations — so a station leader can see what&apos;s fine,
            what needs a decision, and what to do next. In seconds, in plain words.
          </p>
          <div className="px-fadeup-3 mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded bg-sky-600 px-7 py-3.5 text-[16px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)] transition-colors hover:bg-[#1d4ed8]"
            >
              Get Started
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <a
              href="#values"
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-6 py-3.5 text-[15px] font-semibold text-slate-700 transition-colors hover:border-sky-400 hover:text-sky-700"
            >
              See what&apos;s inside
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>
          <p className="px-fadeup-4 mt-5 text-[13px] font-medium text-slate-500">
            No sign-up · demo data only · keeps working offline
          </p>
        </div>
      </section>

      {/* ---------- trust strip ---------- */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-6 md:px-6">
          {TRUST.map((t) => (
            <span key={t} className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-600">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- values ---------- */}
      <section id="values" className="scroll-mt-20 border-b border-slate-200 bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-700">What POLAR-X gives you</p>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-slate-900 md:text-[36px]">
              Six promises, kept in writing.
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-slate-600">
              Each one is visible in the app right now — not a roadmap item. Open the
              app and check us on every promise below.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="panel panel-hover flex flex-col gap-3 p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-50 text-sky-600 ring-1 ring-sky-200">
                  <v.icon className="h-5.5 w-5.5" strokeWidth={1.9} />
                </span>
                <h3 className="text-[17px] font-bold tracking-[-0.01em] text-slate-900">{v.title}</h3>
                <p className="text-[14.5px] leading-6.5 text-slate-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-700">How it works</p>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-slate-900 md:text-[36px]">
              Three steps. No training day.
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="panel flex flex-col gap-3 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-display text-[15px] font-bold text-white">
                  {s.n}
                </span>
                <h3 className="text-[17px] font-bold tracking-[-0.01em] text-slate-900">{s.title}</h3>
                <p className="text-[14.5px] leading-6.5 text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- human-in-the-loop band ---------- */}
      <section className="border-b border-slate-200 bg-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center md:px-6">
          <span className="inline-flex items-center gap-2 rounded border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.1em] text-sky-300">
            Human-in-the-loop
          </span>
          <h2 className="max-w-2xl font-display text-[28px] font-bold leading-tight tracking-[-0.02em] text-white md:text-[34px]">
            AI suggests. People decide. Nothing moves by itself.
          </h2>
          <p className="max-w-xl text-[15.5px] leading-7 text-slate-300">
            Every dispatch, reorder and route check ends with a human yes — and each
            yes or no is sealed into the mission record forever.
          </p>
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center md:px-6 md:py-24">
          <h2 className="max-w-2xl font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-slate-900 md:text-[38px]">
            Ready for a look around the station?
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-7 text-slate-600">
            The full prototype is one click away — mission overview, cargo trail,
            supplies, people, emergencies, rules and the black box. All demo data,
            clearly labelled.
          </p>
          <Link
            href="/app"
            className="mt-9 inline-flex items-center gap-2 rounded bg-sky-600 px-8 py-4 text-[17px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.5)] transition-colors hover:bg-[#1d4ed8]"
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center md:flex-row md:px-6 md:text-left">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7" />
            <span className="text-[14px] font-bold text-slate-900">POLAR-X</span>
          </div>
          <p className="max-w-xl text-[12.5px] leading-5 text-slate-500">
            SIH 2026 · Problem SIH26062 — Integrated Polar Expedition Logistics and
            Asset Management System · Working prototype with demo data only, not
            connected to any live station system.
          </p>
        </div>
      </footer>
    </div>
  );
}
