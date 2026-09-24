"use client";

import { useEffect } from "react";
import { usePolar, pendingUpdates } from "@/lib/polar-store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/verbs";
import type { View } from "@/lib/polar-data";
import {
  Radar,
  Compass,
  Ship,
  Package2,
  Users,
  Siren,
  History,
  Radio,
  BrainCircuit,
  SlidersHorizontal,
  Database,
  ChevronDown,
} from "lucide-react";

/* STEP 8.1 — Mission-operations navigation:
   - PRIMARY items (daily work) are ALWAYS visible
   - SECONDARY items (trust & records) collapse into a <details> group
   - the nav list itself scrolls; brand and status bar are fixed
   Plain everyday words: no jargon in the menu. */
type NavItem = { view: View; label: string; icon: typeof Radar; danger?: boolean };

const PRIMARY_ITEMS: NavItem[] = [
  { view: "command", label: "Mission Overview", icon: Radar },
  { view: "expeditions", label: "Expedition Plans", icon: Compass },
  { view: "cargo", label: "Cargo & Shipments", icon: Ship },
  { view: "logistics", label: "Equipment & Supplies", icon: Package2 },
  { view: "personnel", label: "People", icon: Users },
  { view: "emergency", label: "Emergency", icon: Siren, danger: true },
  { view: "comms", label: "Messages", icon: Radio },
];

const SECONDARY_ITEMS: NavItem[] = [
  { view: "rules", label: "Alert Rules", icon: SlidersHorizontal },
  { view: "blackbox", label: "Black Box", icon: Database },
  { view: "decisions", label: "Past Decisions", icon: History },
  { view: "assistant", label: "AI Assistant", icon: BrainCircuit },
];

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={() => {
        usePolar.getState().setView(item.view);
        onNavigate?.();
      }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-sm border-l-2 px-3 py-2.5 text-left transition-colors",
        active
          ? "border-sky-500 bg-sky-100 font-semibold text-sky-700"
          : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800"
      )}
    >
      <item.icon
        className={cn(
          "h-[17px] w-[17px] shrink-0",
          item.danger && !active ? "text-rose-500" : active ? "text-sky-700" : "text-slate-500 group-hover:text-sky-700"
        )}
        strokeWidth={active ? 2 : 1.8}
      />
      <span className="truncate text-[14.5px] tracking-[-0.005em]">{item.label}</span>
    </button>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const view = usePolar((s) => s.view);

  const isActive = (item: NavItem) => view === item.view || (item.view === "logistics" && view === "assets");

  return (
    /* STEP 8.1 — the scrollable middle: primary always visible on top,
       secondary collapsible, so nothing important is ever scrolled away */
    <nav aria-label="Modules" className="mt-1.5 min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
      <div>
        <p className="px-3 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          Operations
        </p>
        <div className="space-y-0.5">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink key={item.view} item={item} active={isActive(item)} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      <details className="group mt-1 rounded-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 transition-colors hover:text-slate-700">
          Trust &amp; records
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="space-y-0.5 pb-2">
          {SECONDARY_ITEMS.map((item) => (
            <NavLink key={item.view} item={item} active={isActive(item)} onNavigate={onNavigate} />
          ))}
        </div>
      </details>
    </nav>
  );
}

/* Brand mark — polar triangle; amber fill when the uplink is down */
function BrandMark({ online }: { online: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
      <path d="M20 4 L34 30 L6 30 Z" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 13 L26 26 L14 26 Z" fill={online ? "#3b82f6" : "#f59e0b"} />
      <circle cx="20" cy="33.4" r="1.8" fill={online ? "#10b981" : "#f59e0b"} />
    </svg>
  );
}

function BrandBlock() {
  const online = usePolar((s) => s.online);
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-4">
      <BrandMark online={online} />
      <div className="flex min-w-0 flex-col">
        <span className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-slate-900">POLAR-X</span>
        <span className="truncate text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Mission operations
        </span>
      </div>
    </div>
  );
}

/* Bottom status card — doubles as the simulated uplink toggle.
   ONLINE: green dot + sync age; OFFLINE: amber + pending count;
   the Mission Overview uses the purple sync-queue badge for queue state. */
function LinkStatusCard() {
  const online = usePolar((s) => s.online);
  const setOnline = usePolar((s) => s.setOnline);
  const syncState = usePolar((s) => s.syncState);
  const pending = usePolar(pendingUpdates);

  const syncLabel = !online
    ? pending > 0
      ? `${pending} waiting to send`
      : "Saved on this device"
    : syncState === "syncing"
      ? "Sending…"
      : syncState === "synced"
        ? "All sent ✓"
        : "2 min ago";

  return (
    <div className="shrink-0 border-t border-slate-200 p-3">
      <button
        type="button"
        role="switch"
        aria-checked={online}
        title="Demo control — pretend the satellite link dropped to see offline mode"
        onClick={() => setOnline(!online)}
        className={cn(
          "w-full rounded-md border px-3.5 py-3 text-left transition-colors",
          online ? "border-slate-200 bg-slate-50 hover:border-sky-400" : "border-amber-300 bg-amber-50 hover:border-amber-400"
        )}
      >
        <span className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", online ? "bg-emerald-500" : "animate-pulse bg-amber-500")} />
            <span
              className={cn(
                "text-[12px] font-bold uppercase tracking-[0.12em]",
                online ? "text-slate-800" : "text-amber-700"
              )}
            >
              {online ? "Online" : "Offline"}
            </span>
          </span>
          <span className="text-[12px] font-semibold tracking-[0.04em] text-slate-500">SIH26062</span>
        </span>
        <span className="mt-1.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-500">{t("Last simulated send", "Last sent")}</span>
          <span
            className={cn(
              "text-[12px] font-semibold",
              syncState === "synced" ? "text-emerald-700" : !online && pending > 0 ? "text-amber-700" : "text-slate-600"
            )}
          >
            {syncLabel}
          </span>
        </span>
      </button>
    </div>
  );
}

export function Sidebar() {
  const sidebarOpen = usePolar((s) => s.sidebarOpen);
  const setSidebarOpen = usePolar((s) => s.setSidebarOpen);

  /* STEP 9.2 — Escape closes the mobile drawer */
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* desktop rail — offset below the environment badge (h-9) */}
      <aside className="fixed left-0 top-9 z-50 hidden h-[calc(100%-2.25rem)] w-72 select-none flex-col overflow-hidden border-r border-slate-200 bg-white lg:flex">
        <BrandBlock />
        <NavList />
        <LinkStatusCard />
      </aside>

      {/* mobile drawer — offset below the environment badge (h-9) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-9 z-50 lg:hidden",
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!sidebarOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-72 flex-col overflow-hidden border-r border-slate-200 bg-white transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <BrandBlock />
          <NavList onNavigate={() => setSidebarOpen(false)} />
          <LinkStatusCard />
        </aside>
      </div>
    </>
  );
}

/* STEP 8.2 — active-state breadcrumb shown above the page content */
const VIEW_TITLES: Record<View, string> = {
  command: "Mission Overview",
  expeditions: "Expedition Plans",
  cargo: "Cargo & Shipments",
  logistics: "Equipment & Supplies",
  assets: "Equipment Registry",
  personnel: "People",
  emergency: "Emergency",
  comms: "Messages",
  decisions: "Past Decisions",
  rules: "Alert Rules",
  blackbox: "Black Box",
  assistant: "AI Assistant",
};

export function Breadcrumb() {
  const view = usePolar((s) => s.view);
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
      <span>POLAR-X</span>
      <span aria-hidden>/</span>
      <span className="font-medium text-slate-900">{VIEW_TITLES[view]}</span>
    </nav>
  );
}
