"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type { View, Incident, Priority, CommMessage, CommPriority, CargoConsignment, DecisionEntry } from "@/lib/polar-data";
import {
  BASE_INCIDENTS,
  SIMULATED_INCIDENT,
  WHITEOUT_STEPS,
  COMMS_SEED,
  assistantFor,
  type SupplyKey,
} from "@/lib/polar-data";
import { setScenarioNow } from "@/lib/clock";

/* STEP 2.1 — this build is ALWAYS a simulation: the scenario clock is
   self-initialised to the fixed demo instant (17 Sep 2026, 14:32 IST)
   inside clock.ts. setScenarioNow is re-exported for completeness. */
void setScenarioNow;

/* Decisions recorded by a human this session (Next Feasible Opportunity,
   rehearsals, drill sign-offs) — surfaced in the Decision Log view. */
export interface SessionDecision extends DecisionEntry {
  session: true;
  status: "PROPOSED" | "APPROVED";
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text?: string;
  verdict?: string;
  reasons?: string[];
  actions?: string[];
  priority?: Priority;
  link?: { label: string; view: View; expeditionId?: string; assetId?: string };
}

type SyncState = "idle" | "syncing" | "synced";

const SIM_ID = SIMULATED_INCIDENT.id;

interface PolarState {
  view: View;
  setView: (v: View) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  selectedExpeditionId: string | null;
  openExpedition: (id: string) => void;
  clearExpedition: () => void;

  selectedAssetId: string | null;
  openAsset: (id: string) => void;
  clearAsset: () => void;

  selectedCargoId: string | null;
  openCargo: (id: string) => void;
  clearCargo: () => void;

  resupplyModalOpen: boolean;
  resupplyItem: SupplyKey;
  openResupply: (item: SupplyKey) => void;
  setResupplyModalOpen: (open: boolean) => void;

  forecastKey: SupplyKey;
  setForecastKey: (k: SupplyKey) => void;

  focusForecast: boolean;
  pokeForecast: () => void;

  /* whiteout emergency state machine */
  incidents: Incident[];
  simulateEmergency: () => void;
  validateRoute: () => void;
  haltMovement: () => void;
  authorizeDispatch: () => void;
  acknowledgeIncident: (id: string) => void;
  resetDrill: () => void;

  /* offline-first demo */
  online: boolean;
  syncState: SyncState;
  setOnline: (on: boolean) => void;

  /* mission comms */
  messages: CommMessage[];
  /** opts.queue: hold as QUEUED even when online (P2-5 draft/queue flow) */
  sendMessage: (to: string, priority: CommPriority, text: string, opts?: { queue?: boolean }) => void;

  /* report */
  reportOpen: boolean;
  setReportOpen: (open: boolean) => void;

  chat: ChatMessage[];
  chatSeq: number;
  assistantTyping: boolean;
  askAssistant: (question: string) => void;

  /* institutional memory — human decisions logged this session */
  loggedDecisions: SessionDecision[];
  recordDecision: (d: Omit<SessionDecision, "session">) => void;
}

export const usePolar = create<PolarState>((set, get) => ({
  view: "command",
  setView: (v) => set({ view: v, sidebarOpen: false }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  selectedExpeditionId: null,
  openExpedition: (id) => set({ selectedExpeditionId: id, view: "expeditions", sidebarOpen: false }),
  clearExpedition: () => set({ selectedExpeditionId: null }),

  selectedAssetId: null,
  openAsset: (id) => set({ selectedAssetId: id }),
  clearAsset: () => set({ selectedAssetId: null }),

  selectedCargoId: null,
  openCargo: (id) => set({ selectedCargoId: id, view: "cargo", sidebarOpen: false }),
  clearCargo: () => set({ selectedCargoId: null }),

  resupplyModalOpen: false,
  resupplyItem: "oxygen",
  openResupply: (item) => set({ resupplyModalOpen: true, resupplyItem: item }),
  setResupplyModalOpen: (open) => set({ resupplyModalOpen: open }),

  forecastKey: "oxygen",
  setForecastKey: (k) => set({ forecastKey: k }),

  focusForecast: false,
  pokeForecast: () => {
    set({ focusForecast: true, forecastKey: "oxygen" });
    setTimeout(() => set({ focusForecast: false }), 2600);
  },

  /* ---------------------------------------------------------------- */
  /* Whiteout incident — DETECTED → ASSESSED → APPROVED → DISPATCHED   */
  /* → RESPONDING → RESOLVED                                          */
  /* ---------------------------------------------------------------- */

  incidents: [...BASE_INCIDENTS],

  simulateEmergency: () => {
    const sim = { ...SIMULATED_INCIDENT, status: "DETECTED" as const, step: 0, routeValidated: false, halted: false };
    set((s) => ({
      incidents: [sim, ...s.incidents.filter((i) => i.id !== SIM_ID)],
    }));
    /* steps 1-2 auto-complete with staggered timing (detection → personnel → assets checked) */
    const advance = (step: number | null, status: Incident["status"], delay: number) =>
      setTimeout(() => {
        set((s) => ({
          incidents: s.incidents.map((i) =>
            i.id === SIM_ID && i.status !== "RESOLVED" && i.status !== "DISPATCHED" && i.status !== "RESPONDING"
              ? { ...i, step: step === null ? i.step ?? 0 : Math.max(i.step ?? 0, step), status }
              : i
          ),
        }));
      }, delay);
    advance(1, "DETECTED", 900);
    advance(2, "DETECTED", 1800);
    advance(null, "ASSESSED", 2700); /* nearby assets checked → ASSESSED, awaiting route validation */
  },

  validateRoute: () => {
    if (get().incidents.find((i) => i.id === SIM_ID)?.routeValidated) return;
    set((s) => ({
      incidents: s.incidents.map((i) => (i.id === SIM_ID ? { ...i, routeValidated: true, step: Math.max(i.step ?? 0, 3) } : i)),
    }));
    /* route validated (3) → resources checked (4) → recommendation generated (5) */
    setTimeout(() => {
      set((s) => ({
        incidents: s.incidents.map((i) => (i.id === SIM_ID ? { ...i, step: Math.max(i.step ?? 0, 4) } : i)),
      }));
    }, 700);
    setTimeout(() => {
      set((s) => ({
        incidents: s.incidents.map((i) => (i.id === SIM_ID ? { ...i, step: Math.max(i.step ?? 0, 5) } : i)),
      }));
      toast.success("Resources verified — SV-04 fuel 90% · rescue winch verified. Recommendation ready for approval.", { duration: 4500 });
    }, 1400);
  },

  haltMovement: () => {
    set((s) => ({
      incidents: s.incidents.map((i) => (i.id === SIM_ID ? { ...i, halted: true } : i)),
      messages: [
        ...s.messages,
        {
          id: `MSG-${1200 + s.messages.length}`,
          from: "COMMAND",
          to: "ALL UNITS",
          text: "Movement halted. Remain at current position.",
          time: new Date().toISOString().slice(11, 16),
          priority: "EMERGENCY" as const,
          status: s.online ? ("DELIVERED" as const) : ("QUEUED" as const),
          channel: s.online ? "SATCOM broadcast" : "Offline queue",
        },
      ],
    }));
    toast.success("Halt order transmitted — all field units advised to hold position", { duration: 4000 });
  },

  authorizeDispatch: () => {
    const inc = get().incidents.find((i) => i.id === SIM_ID);
    if (!inc || !inc.routeValidated) return;
    set((s) => ({
      incidents: s.incidents.map((i) => (i.id === SIM_ID ? { ...i, status: "APPROVED" as const, step: Math.max(i.step ?? 0, 7) } : i)),
    }));
    setTimeout(() => {
      set((s) => ({
        incidents: s.incidents.map((i) => (i.id === SIM_ID ? { ...i, status: "DISPATCHED" as const } : i)),
      }));
      toast.success("DISPATCHED — SV-04 rolling from Maitri QRF pad · ETA 38 min", { duration: 5000 });
    }, 800);
    setTimeout(() => {
      set((s) => ({
        incidents: s.incidents.map((i) => (i.id === SIM_ID ? { ...i, status: "RESPONDING" as const, step: 9 } : i)),
      }));
    }, 2600);
  },

  acknowledgeIncident: (id) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id
          ? { ...i, status: "RESOLVED" as const, lifecycle: "RESOLVED" as const, step: 9, resolvedAt: new Date().toISOString() }
          : i
      ),
    })),

  resetDrill: () => set((s) => ({ incidents: s.incidents.filter((i) => i.id !== SIM_ID) })),

  /* ---------------------------------------------------------------- */
  /* Offline-first demo — ONLINE/OFFLINE toggle + pending sync         */
  /* ---------------------------------------------------------------- */

  online: true,
  syncState: "idle",

  setOnline: (on) => {
    if (on) {
      const pending = pendingUpdates(get());
      set({ online: true });
      if (pending <= 0) return;
      set({ syncState: "syncing" });
      setTimeout(() => {
        set((s) => ({
          messages: s.messages.map((m) => (m.status === "QUEUED" ? { ...m, status: "SYNCING" as const, channel: "SATCOM (sync)" } : m)),
        }));
      }, 700);
      setTimeout(() => {
        set((s) => ({
          messages: s.messages.map((m) => (m.status !== "DELIVERED" ? { ...m, status: "DELIVERED" as const } : m)),
          syncState: "synced",
        }));
        setTimeout(() => set({ syncState: "idle" }), 3000);
      }, 2100);
      return;
    }
    /* going offline: local ops stay available — updates accumulate for sync */
    set({ online: false, syncState: "idle" });
  },

  /* ---------------------------------------------------------------- */
  /* Mission comms                                                     */
  /* ---------------------------------------------------------------- */

  messages: [...COMMS_SEED],

  sendMessage: (to, priority, text, opts) => {
    const { online, messages } = get();
    const queued = !online || opts?.queue === true;
    const msg: CommMessage = {
      id: `MSG-${1200 + messages.length}`,
      from: "COMMAND",
      to,
      text,
      time: new Date().toISOString().slice(11, 16),
      priority,
      status: queued ? "QUEUED" : "DELIVERED",
      channel: queued ? "Offline queue" : "SATCOM",
    };
    set({ messages: [...messages, msg] });
    if (queued) {
      toast.info(opts?.queue && online ? "MESSAGE QUEUED — HELD UNTIL YOU RELEASE THE QUEUE" : "MESSAGE QUEUED — WILL SYNC WHEN CONNECTION RETURNS", { duration: 4500 });
    } else {
      toast.success(`Transmitted to ${to} via SATCOM (simulated)`, { duration: 3000 });
    }
  },

  /* report */
  reportOpen: false,
  setReportOpen: (open) => set({ reportOpen: open }),

  loggedDecisions: [],
  recordDecision: (d) =>
    set((s) => ({
      loggedDecisions: [{ ...d, session: true }, ...s.loggedDecisions],
    })),

  chat: [],
  chatSeq: 0,
  assistantTyping: false,
  askAssistant: (question) => {
    const answer = assistantFor(question);
    set((s) => ({
      chat: [...s.chat, { id: s.chatSeq, role: "user" as const, text: question }],
      chatSeq: s.chatSeq + 1,
      assistantTyping: true,
    }));
    setTimeout(() => {
      set((s) => ({
        chat: [
          ...s.chat,
          {
            id: s.chatSeq,
            role: "assistant" as const,
            verdict: answer.verdict,
            reasons: answer.reasons,
            actions: answer.actions,
            priority: answer.priority,
            link: answer.link,
          },
        ],
        chatSeq: s.chatSeq + 1,
        assistantTyping: false,
      }));
    }, 1100);
  },
}));

export type { CargoConsignment };

/* derived: pending updates waiting to sync (queued/syncing messages + 2 simulated telemetry streams) */
export function pendingUpdates(s: { online: boolean; messages: CommMessage[] }): number {
  return (s.online ? 0 : 2) + s.messages.filter((m) => m.status === "QUEUED" || m.status === "SYNCING").length;
}
