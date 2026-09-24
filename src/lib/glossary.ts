/**
 * P1-3 + STEP 6.3 — plain-English definitions for domain words AND the
 * canonical severity/status vocabulary. Rendered inline via
 * <Term word="QRF" /> and listed in the Glossary modal (top-bar help).
 */
export const GLOSSARY: Record<string, string> = {
  QRF: "Quick Reaction Force — the rescue team and vehicle kept ready to go at a moment's notice",
  SAR: "Search and Rescue — the organised effort to find and help people in danger",
  SATCOM: "Satellite Communication — the radio link that works through satellites when nothing else does",
  IMD: "India Meteorological Department — the national weather agency",
  GPR: "Ground Penetrating Radar — an instrument that maps what lies under the ice",
  "ice-edge transfer": "Transferring cargo from ship to shore across sea ice",
  "custody chain": "Digital trail of who handled cargo at each step",
  "met uplink": "Meteorological data transmission — weather readings sent back to base",
  whiteout: "Snow blown by wind so thick that the sky and ground blend into one white surface — you cannot see where you are going",
  handover: "The moment one person signs a package over to the next person, so responsibility is always clear",
  readiness: "Whether a vehicle, tool or team can actually be used right now — not just whether it exists",
  resupply: "Sending new stock (oxygen, food, fuel) before the current supply runs out",
  beacon: "A small emergency radio that sends out your location so rescuers can find you",
  telemetry: "Automatic measurements (position, battery, temperature) sent back from vehicles and equipment",
  sortie: "One trip by an aircraft or vehicle, out and back",
  "SY-118": "Demo flight code for the scheduled supply aircraft",
};

/** Words that look different in a sentence than in the map (lowercased lookup). */
export function lookupTerm(word: string): string | undefined {
  return GLOSSARY[word] ?? GLOSSARY[word.toLowerCase()];
}

/* STEP 6.3 — the canonical severity & status vocabulary, shown at the top
   of the Glossary so every badge in the app reads the same way. */
export const SEVERITY_GUIDE: { icon: string; label: string; meaning: string }[] = [
  { icon: "bg-rose-500", label: "Critical", meaning: "Immediate danger to life or mission" },
  { icon: "bg-orange-500", label: "High", meaning: "Significant impact, response required today" },
  { icon: "bg-amber-500", label: "Medium", meaning: "Elevated risk, monitor closely" },
  { icon: "bg-emerald-500", label: "Low", meaning: "Informational, no action needed" },
];

export const STATUS_GUIDE: { icon: string; label: string; meaning: string }[] = [
  { icon: "bg-blue-500", label: "Open", meaning: "Detected, not yet acknowledged" },
  { icon: "bg-violet-500", label: "Acknowledged", meaning: "Someone has seen it" },
  { icon: "bg-cyan-500", label: "In Progress", meaning: "Action being taken" },
  { icon: "bg-emerald-500", label: "Resolved", meaning: "Complete" },
  { icon: "bg-slate-300", label: "Dismissed", meaning: "Not an issue after review" },
];

export const DATA_STATE_GUIDE: { icon: string; label: string; meaning: string }[] = [
  { icon: "bg-emerald-500", label: "Live", meaning: "Real feed, arriving right now" },
  { icon: "bg-amber-500", label: "Simulated", meaning: "Faithful demo copy of what a real feed would show — nothing here is a real operation" },
  { icon: "bg-blue-500", label: "Practice scenario", meaning: "Training content — NOT an active incident" },
  { icon: "bg-slate-300", label: "Archived", meaning: "Kept for the record, no longer active" },
];
