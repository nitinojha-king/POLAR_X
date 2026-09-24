"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Radio,
  Send,
  CloudOff,
  RefreshCw,
  CircleCheck,
  Inbox,
  ShieldAlert,
} from "lucide-react";
import { COMMS_RECIPIENTS, type CommPriority } from "@/lib/polar-data";
import { usePolar, pendingUpdates } from "@/lib/polar-store";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { LoadingState, OfflineState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { t } from "@/lib/verbs";
import { Panel, PanelHeader, Provenance, PrototypeTag, TactButton, CommPriorityChip, CargoStatusChip } from "./ui-bits";

const PRIORITIES: CommPriority[] = ["NORMAL", "HIGH", "EMERGENCY"];

const PRIORITY_BTN: Record<CommPriority, string> = {
  NORMAL: "border-sky-300 bg-sky-50 text-sky-700",
  HIGH: "border-amber-300 bg-amber-50 text-amber-800",
  EMERGENCY: "border-rose-300 bg-rose-50 text-rose-700",
};

function Composer() {
  const online = usePolar((s) => s.online);
  const sendMessage = usePolar((s) => s.sendMessage);
  const [recipient, setRecipient] = useState("ANT-09");
  const [priority, setPriority] = useState<CommPriority>("NORMAL");
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);

  const submit = () => {
    const t = text.trim();
    if (!t) {
      toast.error("Write a message first");
      return;
    }
    /* P0-3: transmitting is high-consequence — confirm first */
    setConfirming(true);
  };

  const doSend = (opts?: { queue?: boolean }) => {
    sendMessage(recipient, priority, text.trim(), opts);
    setText("");
  };

  return (
    <Panel padded={false} className="overflow-hidden">
      <PanelHeader
        index="SEC.02"
        title="Write a message"
        right={
          <span className={cn(
            "flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-tele text-label-micro font-bold uppercase tracking-wider",
            online ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-800"
          )}>
            {online ? "Connection ready" : "Offline — will send later"}
          </span>
        }
      />
      <div className="space-y-3 p-3.5">
        {/* recipient */}
        <div>
          <label htmlFor="px-recipient" className="font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">
            Recipient
          </label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {COMMS_RECIPIENTS.map((r) => (
              <button
                key={r}
                id={r === recipient ? "px-recipient" : undefined}
                type="button"
                onClick={() => setRecipient(r)}
                className={cn(
                  "rounded-sm border px-2 py-1 font-tele text-label-micro font-bold uppercase tracking-wider transition-colors",
                  r === recipient
                    ? "border-sky-600 bg-sky-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* priority */}
        <div>
          <span className="font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">Priority</span>
          <div className="mt-1.5 flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={priority === p}
                onClick={() => setPriority(p)}
                className={cn(
                  "flex-1 rounded-sm border px-2 py-1.5 font-tele text-label-micro font-bold uppercase tracking-wider transition-colors",
                  priority === p ? `${PRIORITY_BTN[p]} ring-1 ring-current` : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* message */}
        <div>
          <label htmlFor="px-comm-text" className="font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">
            Message
          </label>
          <textarea
            id="px-comm-text"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="Work messages only: positions, movement advice, supply requests…"
            className="mt-1.5 w-full resize-none rounded-sm border border-slate-300 bg-white p-2.5 text-body-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* P2-5 — preview before transmit: exactly what will go out, over which channel */}
        {text.trim() && (
          <div className="rounded-sm border border-slate-300 bg-slate-50 p-2.5" aria-label="Message preview">
            <div className="font-tele text-label-micro font-bold uppercase tracking-wider text-slate-500">Preview — what will be sent</div>
            <dl className="mt-1.5 space-y-1 text-[12.5px] leading-snug">
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-500">To</dt><dd className="font-tele font-bold text-slate-800">{recipient}</dd></div>
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-500">Priority</dt><dd className="font-tele font-bold text-slate-800">{priority}</dd></div>
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-500">Channel</dt><dd className="text-slate-800">{online ? "SATCOM" : "Offline queue"}</dd></div>
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-500">Body</dt><dd className="text-slate-800">{text.trim()}</dd></div>
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-500">Chars</dt><dd className="font-tele text-slate-800">{text.trim().length}/160</dd></div>
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-500">Mode</dt><dd><span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11.5px] font-bold text-amber-800"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />SIMULATED</span></dd></div>
              <div className="flex gap-2"><dt className="w-16 shrink-0 font-semibold text-slate-500">ETA</dt><dd className="text-slate-800">~2 min delivery</dd></div>
            </dl>
          </div>
        )}

        {!online && (
          <div className="flex items-start gap-2 rounded-sm border border-amber-300 bg-amber-50 p-2.5 font-tele text-label-micro font-bold uppercase tracking-wider text-amber-800">
            <CloudOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Message saved — it will send itself when the connection returns
          </div>
        )}

        <TactButton className="w-full py-2" onClick={submit} variant={priority === "EMERGENCY" ? "danger" : "primary"}>
          <Send className="h-3.5 w-3.5" /> {priority === "EMERGENCY" ? "Send emergency message" : `Send to ${recipient}`}
        </TactButton>

        {/* P0-3 + P2-5 — confirmation before transmit with draft/queue/transmit options */}
        <ConfirmationModal
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={() => doSend()}
          action={t(`Simulate send · ${priority} message`, `Transmit ${priority} message`)}
          target={recipient}
          priority={priority}
          consequence="Will be added to the communications log"
          isSimulated
          approver="Cmdr. V. Vance"
          confirmLabel={t("Confirm simulation", "Confirm & Transmit")}
          details={[
            { label: "Channel", value: online ? "SATCOM" : "Offline queue" },
            { label: "Chars", value: `${text.trim().length}/160` },
            { label: "ETA", value: "~2 min delivery" },
          ]}
          actions={[
            { label: "Save Draft", onPick: () => { toast.info("Draft saved to this device (demo) — nothing transmitted"); } },
            { label: "Queue", onPick: () => doSend({ queue: true }) },
            { label: t("Confirm simulation", "Confirm & Transmit"), primary: true, onPick: () => doSend() },
          ]}
        />
      </div>
    </Panel>
  );
}

export function CommsView() {
  const messages = usePolar((s) => s.messages);
  const online = usePolar((s) => s.online);
  const syncState = usePolar((s) => s.syncState);
  const pending = usePolar(pendingUpdates);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, syncState]);

  const queued = messages.filter((m) => m.status === "QUEUED").length;

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-sky-200 bg-sky-50">
            <Radio className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <div className="font-tele text-label-micro uppercase tracking-[0.18em] text-slate-500">Messages between base and field teams</div>
            <h1 className="font-display text-headline-lg text-slate-900">Mission Comms</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <PrototypeTag>Working demo — offline mode included</PrototypeTag>
          <Provenance note="From: demo message relay" />
        </div>
      </div>

      {/* offline / sync banner — P2-7 designed states */}
      {!online && <OfflineState pending={pending} />}
      {syncState === "syncing" && <LoadingState what="outgoing messages" />}
      {syncState === "synced" && (
        <div className="px-fadeup flex flex-wrap items-center gap-2.5 rounded-sm border border-emerald-300 bg-emerald-50 px-3.5 py-2.5">
          <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-tele text-label-caps font-bold uppercase tracking-[0.12em] text-emerald-800">
            All messages delivered ✓
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* traffic log */}
        <Panel padded={false} className="overflow-hidden lg:col-span-8">
          <PanelHeader
            index="SEC.01"
            title="Message log"
            right={
              <span className="flex items-center gap-2 font-tele text-label-micro uppercase text-slate-500">
                {messages.length} messages
                <span className={cn("flex items-center gap-1 font-bold", online ? "text-emerald-700" : "text-amber-700")}>
                  <span className={cn("h-1.5 w-1.5 animate-pulse rounded-full", online ? "bg-emerald-500" : "bg-amber-500")} />
                  {online ? "Connected" : "Saving on this device"}
                </span>
              </span>
            }
          />
          <div className="max-h-[560px] space-y-2.5 overflow-y-auto p-3.5">
            {messages.map((m) => {
              const mine = m.from === "COMMAND";
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[92%] rounded-sm border p-2.5",
                      mine ? "border-sky-200 bg-sky-50/70" : "border-slate-200 bg-white",
                      m.priority === "EMERGENCY" && "border-rose-300 bg-rose-50/70"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-tele text-telemetry-sm font-bold text-slate-900">
                        {m.from} <span className="text-slate-600">→ {m.to}</span>
                      </span>
                      <CommPriorityChip priority={m.priority} />
                      {m.status !== "DELIVERED" ? (
                        <CargoStatusChip status={m.status} />
                      ) : (
                        <span className="flex items-center gap-1 font-tele text-label-micro font-bold uppercase tracking-wider text-emerald-700">
                          <CircleCheck className="h-3 w-3" /> {t("SIMULATED DELIVERY ✓", "DELIVERED ✓")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-body-md leading-relaxed text-slate-800">{m.text}</p>
                    <div className="mt-1.5 flex items-center gap-2 font-tele text-label-micro uppercase tracking-wider text-slate-600">
                      <span>{m.time} UTC</span>
                      <span aria-hidden>·</span>
                      <span>{m.channel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3.5 py-2">
            <Provenance note="From: demo message relay" />
            <span className="font-tele text-label-micro uppercase tracking-wider text-slate-500">
              For logistics & safety messages only — not chat
            </span>
          </div>
        </Panel>

        {/* compose + posture */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <Composer />

          <Panel padded={false} className="overflow-hidden">
            <PanelHeader index="SEC.03" title="Connection status" />
            <div className="grid grid-cols-2 gap-2 p-3">
              {[
                { icon: Inbox, k: "Waiting to send", v: String(queued), tone: queued > 0 ? "text-amber-700" : "text-slate-900" },
                { icon: ShieldAlert, k: "Emergency msgs (24h)", v: "01", tone: "text-rose-700" },
                { icon: RefreshCw, k: t("Last simulated send", "Last sent"), v: online ? "2 min ago" : "waiting", tone: "text-slate-900" },
                { icon: Radio, k: "Channels", v: "Satellite · Iridium · VHF radio", tone: "text-slate-900" },
              ].map((s) => (
                <div key={s.k} className="well px-2.5 py-2">
                  <div className="flex items-center gap-1 font-tele text-label-micro uppercase tracking-wider text-slate-500">
                    <s.icon className="h-3 w-3" />
                    {s.k}
                  </div>
                  <div className={cn("mt-0.5 font-tele text-telemetry-sm font-bold", s.tone)}>{s.v}</div>
                </div>
              ))}
              <p className="col-span-2 text-body-sm leading-relaxed text-slate-600">
                Demo control: press <span className="font-tele text-label-micro font-bold">{t("Simulation connected", "Connected")}</span> in the top bar to go offline — messages wait on this device, then send and show <span className="font-tele text-label-micro font-bold text-emerald-700">{t("SIMULATED DELIVERY ✓", "DELIVERED ✓")}</span> when the connection returns.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
