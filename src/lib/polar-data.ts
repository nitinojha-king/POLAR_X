/**
 * POLAR-X — Central mock data registry.
 * Single source of truth: every view reads from here so expeditions, assets,
 * inventory, alerts and incidents stay consistent across the whole prototype.
 * All data is simulated for the SIH 2026 judge demo — no live feeds.
 */

import type { Rule } from "@/types/rules";
import type { DataState, LifecycleStatus, Severity } from "@/types/severity";
import { calculateForecast, type ForecastResult } from "@/lib/forecast";
import { getNow, scenarioIsoMinusMinutes } from "@/lib/clock";

/**
 * STEP 1.3/1.4 — THE canonical supply forecasts.
 * Every screen (summary card, chart, alert, tooltip, recommendation)
 * reads its numbers from these — no screen does its own division.
 *   Oxygen: 420 ÷ 62/day = 6.8 days to zero · crosses the 60-unit
 *   alert line after 5.8 days. (Was the "5 days" vs "6 days" conflict.)
 */
export const SUPPLY_FORECASTS: Record<"oxygen" | "food" | "spare", ForecastResult> = {
  oxygen: calculateForecast({ currentStock: 420, burnRatePerDay: 62, alertThreshold: 60, timestamp: new Date().toISOString() }),
  food: calculateForecast({ currentStock: 1930, burnRatePerDay: 112, alertThreshold: 400, timestamp: new Date().toISOString() }),
  spare: calculateForecast({ currentStock: 284, burnRatePerDay: 9, alertThreshold: 60, timestamp: new Date().toISOString() }),
};
export const OXYGEN_FORECAST = SUPPLY_FORECASTS.oxygen;

export type View =
  | "command"
  | "expeditions"
  | "cargo"
  | "logistics"
  | "personnel"
  | "assets"
  | "emergency"
  | "comms"
  | "assistant"
  | "decisions"
  | "rules"
  | "blackbox";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type OpStatus = "OPERATIONAL" | "ATTENTION" | "CRITICAL" | "STANDBY" | "MAINTENANCE";
export type Priority = "ROUTINE" | "MEDIUM" | "HIGH";

/* ------------------------------------------------------------------ */
/* Expeditions                                                         */
/* ------------------------------------------------------------------ */

export interface ExpeditionActivity {
  time: string;
  text: string;
  tone: "info" | "warn" | "ok" | "alert";
}

export type Lifecycle = "PLANNED" | "READY" | "ACTIVE" | "ATTENTION" | "COMPLETED";

export const MISSION_PHASES = ["PLAN", "APPROVE", "DEPLOY", "TRACK", "COMPLETE"] as const;

export interface Expedition {
  id: string;
  code: string;
  mission: string;
  name: string;
  status: OpStatus;
  lifecycle: Lifecycle;
  commander: string;
  personnel: number;
  assets: number;
  durationDays: number;
  dayElapsed: number;
  progress: number;
  location: string;
  risk: RiskLevel;
  started: string;
  vessel?: string;
  departure: string;
  expectedReturn: string;
  weatherWindow: { status: "OPEN" | "MARGINAL" | "CLOSED"; detail: string };
  requiredCargo: { id: string; label: string }[];
  phase: number;
  route: { name: string; reached: boolean; current?: boolean }[];
  logistics: { fuel: number; food: number; medical: number; oxygen: number };
  riskMatrix: { label: string; level: RiskLevel; note: string }[];
  activity: ExpeditionActivity[];
  objective: string;
}

export const EXPEDITIONS: Expedition[] = [
  {
    id: "ant-07",
    code: "ANT-07",
    mission: "EXP-408",
    name: "ANTARCTIC SURVEY EXPEDITION",
    status: "OPERATIONAL",
    lifecycle: "ACTIVE",
    commander: "Dr. Arjun Mehta",
    departure: "07 Aug 2026 · 06:10 IST",
    expectedReturn: "18 Sep 2026 · 18:00 IST",
    weatherWindow: { status: "MARGINAL", detail: "Gust front clearing Zone B — window reopens at 18:00 uplink" },
    requiredCargo: [{ id: "CG-127", label: "Scientific Equipment · 680 kg" }],
    phase: 3,
    personnel: 31,
    assets: 67,
    durationDays: 42,
    dayElapsed: 33,
    progress: 78,
    location: "Research Zone B · En route Bharati",
    risk: "MEDIUM",
    started: "07 Aug 2026",
    vessel: "Ocean Quest",
    route: [
      { name: "Base Camp", reached: true },
      { name: "Maitri", reached: true },
      { name: "Research Zone B", reached: true, current: true },
      { name: "Bharati", reached: false },
    ],
    logistics: { fuel: 78, food: 64, medical: 91, oxygen: 42 },
    riskMatrix: [
      { label: "Weather", level: "MEDIUM", note: "Katabatic gusts expected near Zone B within 72 h" },
      { label: "Fuel", level: "LOW", note: "Reserve covers 19 days at current burn rate" },
      { label: "Equipment", level: "LOW", note: "ATV-021 flagged — see asset intelligence" },
      { label: "Personnel", level: "LOW", note: "All vitals nominal, no fatigue flags" },
    ],
    activity: [
      { time: "08:32", text: "Ocean Quest reached checkpoint CP-04, position logged", tone: "info" },
      { time: "09:10", text: "Inventory sync — consumables updated from Maitri store", tone: "ok" },
      { time: "10:15", text: "Weather warning received: gust front approaching Research Zone B", tone: "warn" },
      { time: "11:20", text: "Vehicle inspection completed on convoy ATV-017 / ATV-021", tone: "ok" },
      { time: "12:05", text: "Oxygen draw reported 18% above forecast at Zone B camp", tone: "alert" },
    ],
    objective:
      "High-resolution glaciological survey of the Research Zone B transect with ice-core retrieval and ground-penetrating radar mapping.",
  },
  {
    id: "ant-08",
    code: "ANT-08",
    mission: "EXP-409",
    name: "CLIMATE RESEARCH EXPEDITION",
    status: "OPERATIONAL",
    lifecycle: "ACTIVE",
    commander: "Dr. Priya Nair",
    departure: "03 Aug 2026 · 05:45 IST",
    expectedReturn: "28 Sep 2026 · 17:30 IST",
    weatherWindow: { status: "OPEN", detail: "Clear katabatic lull — 96 h operating window" },
    requiredCargo: [{ id: "CG-104", label: "Medical Supplies · 420 kg" }],
    phase: 3,
    personnel: 28,
    assets: 54,
    durationDays: 56,
    dayElapsed: 36,
    progress: 64,
    location: "Maitri Station · Local transects",
    risk: "LOW",
    started: "03 Aug 2026",
    route: [
      { name: "Base Camp", reached: true },
      { name: "Maitri", reached: true, current: true },
      { name: "Ice Core Site IC-3", reached: false },
      { name: "Maitri", reached: false },
    ],
    logistics: { fuel: 84, food: 71, medical: 95, oxygen: 58 },
    riskMatrix: [
      { label: "Weather", level: "LOW", note: "Clear window for next 96 h" },
      { label: "Fuel", level: "LOW", note: "Scheduled top-up completed 06 Sep" },
      { label: "Equipment", level: "LOW", note: "All instruments nominal" },
      { label: "Personnel", level: "MEDIUM", note: "Two members entering rotation rest window" },
    ],
    activity: [
      { time: "07:44", text: "Atmospheric aerosol sampler redeployed at ridge site", tone: "ok" },
      { time: "08:50", text: "Daily telemetry packaged for NCPOR uplink (proposed integration)", tone: "info" },
      { time: "10:02", text: "Snow density transect 12 of 18 completed", tone: "info" },
      { time: "11:38", text: "Generator GEN-044 fuel cycle logged", tone: "ok" },
    ],
    objective:
      "Long-duration climate observation: aerosol optical depth, snow accumulation rates and katabatic wind profiling around Maitri.",
  },
  {
    id: "ant-09",
    code: "ANT-09",
    mission: "EXP-411",
    name: "ZONE B SURVEY EXPEDITION",
    status: "ATTENTION",
    lifecycle: "ATTENTION",
    commander: "Dr. Vikram Roy",
    departure: "20 Aug 2026 · 06:40 IST",
    expectedReturn: "26 Sep 2026 · 18:00 IST",
    weatherWindow: { status: "CLOSED", detail: "Katabatic front · whiteout probability 64% — recheck at the 18:00 weather update" },
    requiredCargo: [
      { id: "CG-131", label: "Spare Parts · 310 kg" },
      { id: "CG-127", label: "Scientific Equipment · 680 kg" },
    ],
    phase: 3,
    personnel: 26,
    assets: 41,
    durationDays: 38,
    dayElapsed: 19,
    progress: 51,
    location: "Research Zone B · Princess Astrid Coast",
    risk: "HIGH",
    started: "20 Aug 2026",
    route: [
      { name: "Maitri", reached: true },
      { name: "Waypoint W-2", reached: true },
      { name: "Research Zone B", reached: true, current: true },
      { name: "Return · Maitri", reached: false },
    ],
    logistics: { fuel: 66, food: 55, medical: 88, oxygen: 42 },
    riskMatrix: [
      { label: "Weather", level: "HIGH", note: "High weather risk near Research Zone B — whiteout probability rising" },
      { label: "Fuel", level: "MEDIUM", note: "Field burn rate 12% above plan" },
      { label: "Equipment", level: "MEDIUM", note: "ATV-021 maintenance overdue; CONT-442 seal degraded" },
      { label: "Personnel", level: "LOW", note: "Crew rotated, acclimatisation complete" },
    ],
    activity: [
      { time: "06:55", text: "Team departed waypoint W-2 toward Zone B sample grid", tone: "info" },
      { time: "08:12", text: "ATV-021 reported engine temperature anomaly", tone: "alert" },
      { time: "09:30", text: "Rock core samples 41–48 catalogued", tone: "ok" },
      { time: "10:15", text: "Weather warning received — gust front inbound", tone: "warn" },
      { time: "11:47", text: "Oxygen reserve check flagged below recommended buffer", tone: "alert" },
    ],
    objective:
      "Petrographic and structural mapping of the Schirmacher Oasis margin, with sample recovery for MoES geochronology programme.",
  },
  {
    id: "ant-10",
    code: "ANT-10",
    mission: "EXP-410",
    name: "OCEANOGRAPHIC MISSION",
    status: "OPERATIONAL",
    lifecycle: "ACTIVE",
    commander: "Cdr. Rahul Verma",
    departure: "31 Jul 2026 · 09:00 IST",
    expectedReturn: "18 Sep 2026 · 12:00 IST",
    weatherWindow: { status: "OPEN", detail: "Sea state 3 · ceiling unlimited — CTD ops nominal" },
    requiredCargo: [{ id: "CG-118", label: "Fuel Drums · 1,200 kg" }],
    phase: 3,
    personnel: 42,
    assets: 78,
    durationDays: 49,
    dayElapsed: 40,
    progress: 82,
    location: "Southern Ocean · 68.4°S 32.1°E",
    risk: "LOW",
    started: "31 Jul 2026",
    vessel: "Ocean Quest",
    route: [
      { name: "Port scrutiny · Cape Town", reached: true },
      { name: "Ice edge corridor", reached: true },
      { name: "Survey grid SO-9", reached: true, current: true },
      { name: "Return track", reached: false },
    ],
    logistics: { fuel: 81, food: 76, medical: 93, oxygen: 71 },
    riskMatrix: [
      { label: "Weather", level: "LOW", note: "Sea state 3, favourable for CTD casts" },
      { label: "Fuel", level: "LOW", note: "Bunker plan on schedule" },
      { label: "Equipment", level: "LOW", note: "Multibeam sonar nominal" },
      { label: "Personnel", level: "LOW", note: "Watch rotation stable" },
    ],
    activity: [
      { time: "06:20", text: "CTD cast 22 of 30 completed at grid SO-9", tone: "info" },
      { time: "07:58", text: "Bathymetric swath mapped: +214 km² today", tone: "ok" },
      { time: "09:41", text: "Autonomous glider UG-6 recovered for battery swap", tone: "info" },
      { time: "11:55", text: "Sea ice edge updated on POLAR-X chart", tone: "ok" },
    ],
    objective:
      "Hydrographic survey of the SO-9 grid: water-column profiling, bathymetry and sea-ice extent measurement supporting MoES ocean-climate models.",
  },
];

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

export interface Asset {
  id: string;
  type: string;
  category: "Vehicle" | "UAV" | "Instrument" | "Power" | "Container" | "Support";
  location: string;
  status: OpStatus;
  statusLabel: string;
  health: number;
  battery: number;
  temperature: string;
  lastMaintenance: string;
  expedition: string;
  maintenanceHistory: string[];
  prediction: { days: number; risk: RiskLevel; basis: string };
  note?: string;
  fuelOrBattery?: string;
  lastInspection?: string;
  spareParts?: string;
  recommendation?: string;
}

export const ASSETS: Asset[] = [
  {
    id: "ATV-021",
    type: "All-Terrain Vehicle",
    category: "Vehicle",
    location: "Research Zone B",
    status: "MAINTENANCE",
    statusLabel: "Maintenance",
    health: 58,
    battery: 64,
    temperature: "+2°C engine bay",
    lastMaintenance: "28 Jul 2026",
    expedition: "ANT-09",
    maintenanceHistory: ["Engine inspection", "Track tension adjustment", "Coolant flush"],
    prediction: { days: 3, risk: "HIGH", basis: "Telemetry: coolant temp +14% over 5 sorties; maintenance overdue by 9 days" },
    note: "Maintenance overdue — flagged by predictive engine on 05 Sep 2026.",
    fuelOrBattery: "Diesel 61% · battery 64%",
    lastInspection: "28 Jul 2026 (pre-traverse check)",
    spareParts: "Track-link kit ×1, coolant lines — aboard CG-131 (delayed at Cape Town)",
    recommendation: "Inspect before next mission leg — Prototype Risk Scoring: HIGH",
  },
  {
    id: "DRONE-104",
    type: "Survey UAV",
    category: "UAV",
    location: "Maitri Station",
    status: "OPERATIONAL",
    statusLabel: "Operational",
    health: 92,
    battery: 82,
    temperature: "-18°C",
    lastMaintenance: "12 Aug 2026",
    expedition: "ANT-07",
    maintenanceHistory: ["Inspection", "Sensor calibration", "Battery replacement"],
    prediction: { days: 18, risk: "LOW", basis: "Motor hours well below service interval; cell imbalance within tolerance" },
  },
  {
    id: "RADAR-009",
    type: "Scientific Instrument",
    category: "Instrument",
    location: "Bharati Station",
    status: "ATTENTION",
    statusLabel: "Attention",
    health: 71,
    battery: 100,
    temperature: "-9°C radome",
    lastMaintenance: "19 Aug 2026",
    expedition: "ANT-08",
    maintenanceHistory: ["Receiver alignment", "Firmware update", "Radome de-ice check"],
    prediction: { days: 11, risk: "MEDIUM", basis: "Calibration drift of 0.4 dB detected over 14 days" },
    note: "Calibration drift under monitoring — auto-scheduled for re-alignment.",
  },
  {
    id: "GEN-044",
    type: "Power Generator",
    category: "Power",
    location: "Ocean Quest",
    status: "OPERATIONAL",
    statusLabel: "Operational",
    health: 88,
    battery: 100,
    temperature: "+31°C housing",
    lastMaintenance: "02 Sep 2026",
    expedition: "ANT-10",
    maintenanceHistory: ["Oil and filter change", "Load bank test", "Fuel line inspection"],
    prediction: { days: 24, risk: "LOW", basis: "Vibration signature stable across last 3 load tests" },
  },
  {
    id: "CONT-442",
    type: "Cargo Container",
    category: "Container",
    location: "Research Zone B",
    status: "CRITICAL",
    statusLabel: "Critical",
    health: 34,
    battery: 74,
    temperature: "-31°C cargo bay",
    lastMaintenance: "14 Jun 2026",
    expedition: "ANT-09",
    maintenanceHistory: ["Door seal replacement", "RFID tag audit", "Structural check"],
    prediction: { days: 6, risk: "HIGH", basis: "Thermal seal integrity degraded — internal temp variance exceeding safe band for sensitive cargo" },
    note: "Seal degradation accelerating — cargo transfer recommended before next leg.",
  },
  {
    id: "SV-04",
    type: "Support Vehicle",
    category: "Support",
    location: "Maitri Station",
    status: "STANDBY",
    statusLabel: "Standby",
    health: 96,
    battery: 90,
    temperature: "+1°C engine bay",
    lastMaintenance: "05 Sep 2026",
    expedition: "QRF · Maitri",
    maintenanceHistory: ["Full service", "Rescue winch load test", "Medical kit restock"],
    prediction: { days: 30, risk: "LOW", basis: "Quick-reaction vehicle held at high readiness; minimal runtime accrued" },
    fuelOrBattery: "Fuel 90% · battery 90%",
    lastInspection: "05 Sep 2026 (QRF readiness check)",
    spareParts: "Rescue winch spares + trauma kit sealed — complete",
    recommendation: "Hold at QRF posture — primary support option for ANT-09",
  },
  {
    id: "AWS-12",
    type: "Remote Weather Station",
    category: "Instrument",
    location: "Princess Astrid Coast",
    status: "OPERATIONAL",
    statusLabel: "Operational",
    health: 81,
    battery: 55,
    temperature: "-41°C ambient",
    lastMaintenance: "22 Jul 2026",
    expedition: "Remote network",
    maintenanceHistory: ["Anemometer swap", "Solar panel de-icing", "Battery pack check"],
    prediction: { days: 14, risk: "MEDIUM", basis: "Battery recharge efficiency down 9% — limited insolation window" },
    note: "Telemetry nominal via Iridium uplink every 20 minutes.",
  },
  {
    id: "SNOWCAT-07",
    type: "Tracked Transport",
    category: "Vehicle",
    location: "Maitri Station",
    status: "OPERATIONAL",
    statusLabel: "Operational",
    health: 84,
    battery: 88,
    temperature: "+4°C engine bay",
    lastMaintenance: "29 Aug 2026",
    expedition: "ANT-08",
    maintenanceHistory: ["Track inspection", "Cab heater service", "Hydraulic top-up"],
    prediction: { days: 21, risk: "LOW", basis: "Drivetrain wear indicators nominal" },
  },
];

/* ------------------------------------------------------------------ */
/* Logistics — inventory + supply forecast                             */
/* ------------------------------------------------------------------ */

export type SupplyKey = "fuel" | "food" | "medical" | "oxygen" | "spare";

export interface InventoryItem {
  key: SupplyKey;
  name: string;
  level: number;
  unit: string;
  stock: string;
  dailyDraw: string;
  daysLeft: number;
  status: OpStatus;
  note: string;
  threshold: string;
  nextResupply: string;
}

export const INVENTORY: InventoryItem[] = [
  { key: "fuel", name: "Fuel", level: 78, unit: "%", stock: "8,140 L", dailyDraw: "310 L/day", daysLeft: 26, status: "OPERATIONAL", note: "Combined expedition + station reserve", threshold: "1,200 L station buffer", nextResupply: "18 Sep · CG-118 drums to Bharati" },
  { key: "food", name: "Food", level: 64, unit: "%", stock: "1,930 ration-days", dailyDraw: "112/day", daysLeft: 17, status: "ATTENTION", note: "Fresh produce cycled at each port call", threshold: "400 ration-days", nextResupply: "24 Sep · SY-118 / SY-119 transfer" },
  { key: "medical", name: "Medical Supplies", level: 91, unit: "%", stock: "96% kit completeness", dailyDraw: "Low", daysLeft: 40, status: "OPERATIONAL", note: "Tele-medicine kit verified 04 Sep", threshold: "60% kit completeness", nextResupply: "In transit · CG-104 (420 kg)" },
  /* STEP 1.4 — daysLeft comes from THE forecast function (420 ÷ 62 = 6.8),
     not a hand-written "6". Spare: 284 ÷ 9 = 31.6 (the 14 was unverifiable). */
  { key: "oxygen", name: "Oxygen", level: 42, unit: "%", stock: "420 units", dailyDraw: "62 units/day", daysLeft: OXYGEN_FORECAST.daysUntilZero, status: "CRITICAL", note: "Consumption 18% above forecast at Zone B", threshold: "60 units (min operational buffer)", nextResupply: "24 Sep · SY-118 — approval pending" },
  { key: "spare", name: "Spare Parts", level: 57, unit: "%", stock: "284 line items", dailyDraw: "9 items/day", daysLeft: SUPPLY_FORECASTS.spare.daysUntilZero, status: "ATTENTION", note: "Critical ATV track links run out sooner than the average line item", threshold: "60 line items", nextResupply: "Held at Cape Town · CG-131 delayed" },
];

export interface Forecast {
  key: SupplyKey;
  name: string;
  status: OpStatus;
  statusWord: string;
  stock: string;
  daily: string;
  breach: string;
  breachDays: number;
  threshold: string;
  chart: { day: number; stock: number }[];
}

/* STEP 1.4 — charts are GENERATED from the same burn rates the forecast
   function uses, so the drawn line can never contradict the numbers.
   Oxygen: 420 - 62·i (the old hand-written array showed 60 at day 6,
   implying 420÷62="6 days to zero" — wrong, it is 6.8). */
const OXY_CHART = Array.from({ length: 12 }, (_, i) => Math.max(0, 420 - 62 * i));
const FOOD_CHART = Array.from({ length: 12 }, (_, i) => Math.max(0, 1930 - 112 * i));
const SPARE_CHART = Array.from({ length: 12 }, (_, i) => Math.max(0, 284 - 9 * i));

export const FORECASTS: Forecast[] = [
  /* breach/breachDays now derive from THE forecast function — alert-line
     crossing (daysUntilAlert), rounded for display */
  {
    key: "oxygen",
    name: "OXYGEN",
    status: "CRITICAL",
    statusWord: "CRITICAL",
    stock: "420 units",
    daily: "62 units/day",
    breach: `${OXYGEN_FORECAST.daysUntilAlert} days`,
    breachDays: OXYGEN_FORECAST.daysUntilAlert,
    threshold: "60 units (min operational buffer)",
    chart: OXY_CHART.map((s, i) => ({ day: i, stock: Math.max(0, s) })),
  },
  {
    key: "food",
    name: "FOOD",
    status: "ATTENTION",
    statusWord: "WATCH",
    stock: "1,930 ration-days",
    daily: "112/day",
    breach: `${SUPPLY_FORECASTS.food.daysUntilAlert} days`,
    breachDays: SUPPLY_FORECASTS.food.daysUntilAlert,
    threshold: "400 ration-days",
    chart: FOOD_CHART.map((s, i) => ({ day: i, stock: s })),
  },
  {
    key: "spare",
    name: "SPARE PARTS",
    status: "ATTENTION",
    statusWord: "WATCH",
    stock: "284 line items",
    daily: "9 items/day",
    breach: `${SUPPLY_FORECASTS.spare.daysUntilAlert} days`,
    breachDays: SUPPLY_FORECASTS.spare.daysUntilAlert,
    threshold: "60 line items",
    chart: SPARE_CHART.map((s, i) => ({ day: i, stock: s })),
  },
];

export const RESUPPLY_RECOMMENDATION = {
  action:
    "Dispatch 120 oxygen units during the next scheduled supply transfer (24 Sep · sorties SY-118/SY-119).",
  reason:
    "Current consumption is 18% above expected levels, driven by increased field activity at Research Zone B.",
  impact: [
    "Prevent critical shortage across ANT-07 / ANT-09 field teams",
    "Maintain a 12-day operational buffer beyond the safety threshold",
    "Avoid triggering an emergency resupply mission (est. cost saving: ₹1.8 Cr)",
  ],
  confidence: 87,
  basis: "Simulated projection from POLAR-X prototype logistics engine",
};

/* Per-item resupply plans for the RECOMMEND RESUPPLY modal */
export interface ResupplyPlan {
  item: string;
  quantity: string;
  destination: string;
  transport: string;
  reason: string;
  timing: string;
}

export const RESUPPLY_PLANS: Record<SupplyKey, ResupplyPlan> = {
  oxygen: {
    item: "Oxygen — medical & field breathing supply",
    quantity: "120 units (rebuilds a 12-day buffer above threshold)",
    destination: "Bharati Station, forward to Zone B cache via Maitri",
    transport: "Air sortie SY-118 (Dornier) — 3 days out, on weather standby",
    reason: `Zone B draw is 62 units/day against a 52-unit forecast; the 60-unit operational buffer is crossed in ${OXYGEN_FORECAST.daysUntilAlert} days (full depletion ${OXYGEN_FORECAST.daysUntilZero} days).`,
    timing: "Approve before the 24 Sep transfer window — no later than D+4",
  },
  fuel: {
    item: "Fuel — AN-76 blend for vehicles & generators",
    quantity: "2,000 L (restores 21-day aggregate buffer)",
    destination: "Bharati Station primary tank farm",
    transport: "Vessel transfer CG-118 fuel drums — currently loading at Cape Town",
    reason: "Station aggregate at 78% is healthy, but ANT-09 field burn is 12% above plan and winter draw is approaching.",
    timing: "Bundle with the 18 Sep port call — no expedited action needed",
  },
  food: {
    item: "Rations — expedition & station pools",
    quantity: "600 ration-days (lifts reserve to 22 days above minimum)",
    destination: "Maitri Station central store",
    transport: "Traverse SY-119 snowcat convoy (en route)",
    reason: `64% level with a ${SUPPLY_FORECASTS.food.daysUntilAlert}-day projected crossing of the 400 ration-day buffer; fresh produce window closes at next port call.`,
    timing: "Confirm manifest before 24 Sep loading cut-off",
  },
  medical: {
    item: "Medical supplies — trauma & tele-medicine kits",
    quantity: "Top-up to 100% kit completeness (≈ 30 line items)",
    destination: "Maitri Station clinic + Zone B field cache",
    transport: "CG-104 consignment (420 kg, in transit from Cape Town)",
    reason: "91% completeness is healthy; consumables expired-lot rotation due at next inspection cycle.",
    timing: "Already scheduled — verify inventory on CG-104 arrival",
  },
  spare: {
    item: "Spare parts — ATV track links, generator belts, radar elements",
    quantity: "48 line items (incl. 6 ATV-021 track-link kits)",
    destination: "Maitri workshop + Zone B forward cache",
    transport: "CG-131 consignment — HELD at Cape Town, 36 h delay",
    reason: "Stock at 57% with ATV-021 maintenance overdue; track-link draw accelerates once inspection begins.",
    timing: "Expedite customs clearance — needed before ATV-021 work order",
  },
};

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export interface AlertItem {
  id: string;
  /* STEP 6 — canonical severity (was "CRITICAL" | "WARNING" | "INFO") */
  severity: Severity;
  title: string;
  detail: string;
  source: string;
  time: string;
  goTo: { view: View; expeditionId?: string; assetId?: string };
  /* STEP 11 — every alert cites the rule that produced it */
  ruleId?: string;
  evaluatedCondition?: string;
  lastEvaluated?: string;
}

export const ALERTS: AlertItem[] = [
  {
    id: "alr-oxy",
    severity: "HIGH",
    /* STEP 1.4 — every number comes from OXYGEN_FORECAST (420 ÷ 62/day):
       alert line at 60 units crossed in 5.8 days, full depletion 6.8 days. */
    title: `Oxygen reserves cross the alert line in ${OXYGEN_FORECAST.daysUntilAlert} days`,
    detail:
      `Zone B field teams are drawing 62 units/day against a forecast of 52. At this rate the 60-unit safety buffer is crossed in ${OXYGEN_FORECAST.daysUntilAlert} days and stock reaches zero in ${OXYGEN_FORECAST.daysUntilZero} days. Formula: ${OXYGEN_FORECAST.formula}.`,
    source: "Logistics engine · supply forecast",
    time: "10:42",
    goTo: { view: "logistics" },
    ruleId: "R-02",
    evaluatedCondition: "stock of a tracked supply below its alert line (60 units)",
    lastEvaluated: todayIso("10:42"),
  },
  {
    id: "alr-atv",
    severity: "MEDIUM",
    title: "ATV-021 maintenance overdue",
    detail:
      "Preventive maintenance is 9 days overdue. Coolant temperature trending +14% across recent sorties — failure risk elevated before next leg.",
    source: "Asset intelligence · predictive maintenance",
    time: "09:05",
    goTo: { view: "assets", assetId: "ATV-021" },
    ruleId: "R-03",
    evaluatedCondition: "no valid inspection on record for 7 days",
    lastEvaluated: todayIso("09:05"),
  },
  {
    id: "alr-wx",
    severity: "CRITICAL",
    title: "High weather risk near Research Zone B",
    detail:
      "Fast, cold gusts are closing in — a 64% chance of whiteout within 24 hours. Team movements around ANT-09 are on hold.",
    source: "AWS-12 met telemetry · IMD model link proposed",
    time: "08:20",
    goTo: { view: "expeditions", expeditionId: "ant-09" },
    ruleId: "R-08",
    evaluatedCondition: "clear-line-of-sight probability in the operating zone",
    lastEvaluated: todayIso("08:20"),
  },
];

/* ------------------------------------------------------------------ */
/* Incidents / Emergency                                               */
/* ------------------------------------------------------------------ */

/** ISO stamp for the scenario day at the given HH:MM — used for "resolved today" demo data. */
function todayIso(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  /* clone! mutating getNow() in place would move the whole scenario clock */
  const d = new Date(getNow().getTime());
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toISOString();
}

export interface Incident {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  asset?: string;
  location: string;
  issue: string;
  time: string;
  personnel: number;
  status: IncidentStatus;
  /* STEP 1.2/3.1 — canonical lifecycle & data state. Optional on legacy
     rows: lifecycleOf()/dataStateOf() derive safe defaults. */
  lifecycle?: LifecycleStatus;
  dataState?: DataState;
  /** ISO timestamp set when the incident reaches RESOLVED (drives "resolved today") */
  resolvedAt?: string;
  response?: {
    vehicle: string;
    distance: string;
    eta: string;
    actions: string[];
  };
  simulated?: boolean;
  step?: number;
  routeValidated?: boolean;
  halted?: boolean;
}

/* STEP 3.1 — canonical derivations. The lifecycle is derived from the
   operational status unless stated explicitly; dataState defaults to
   SIMULATED (this whole demo is a simulation of live operations). */
export function lifecycleOf(inc: Incident): LifecycleStatus {
  if (inc.lifecycle) return inc.lifecycle;
  if (inc.status === "RESOLVED") return "RESOLVED";
  return "OPEN";
}

export function dataStateOf(inc: Incident): DataState {
  return inc.dataState ?? "SIMULATED";
}

/** Honest label for an incident's data state — e.g. "Practice scenario — training content, NOT an active incident". */
export function getIncidentLabel(inc: Incident): string {
  switch (dataStateOf(inc)) {
    case "PRACTICE":
      return "Practice scenario — training content, NOT an active incident";
    case "LIVE":
      return "Live data";
    case "ARCHIVED":
      return "Archived record";
    default:
      return "Simulated incident";
  }
}

export const BASE_INCIDENTS: Incident[] = [
  {
    id: "INC-1128",
    title: "Whiteout conditions reported near Research Zone B",
    severity: "MEDIUM",
    location: "Research Zone B",
    issue: "Reduced visibility — team movement suspended pending met update",
    time: "08:20",
    personnel: 26,
    status: "ACTIVE",
    lifecycle: "OPEN",
    dataState: "SIMULATED",
  },
  {
    id: "INC-1121",
    title: "GEN-012 load imbalance auto-corrected",
    severity: "LOW",
    location: "Maitri Station",
    issue: "Phase load imbalance corrected by power controller",
    time: "07:12",
    personnel: 0,
    status: "RESOLVED",
    lifecycle: "RESOLVED",
    dataState: "SIMULATED",
    resolvedAt: todayIso("07:12"),
  },
  {
    id: "INC-1114",
    title: "DRONE-107 link loss — recovered",
    severity: "LOW",
    location: "Ice edge corridor",
    issue: "Temporary telemetry loss during squall; aircraft recovered",
    time: "02 Sep · 11:48",
    personnel: 0,
    status: "RESOLVED",
    lifecycle: "RESOLVED",
    dataState: "ARCHIVED",
    resolvedAt: "2026-09-02T11:48:00.000Z",
  },
];

export const SIMULATED_INCIDENT: Incident = {
  id: "INC-1143",
  title: "WHITEOUT INCIDENT — ANT-09 FIELD TEAM",
  severity: "CRITICAL",
  asset: "SV-04",
  location: "Research Zone B",
  issue: "Whiteout — visibility below 100 m",
  time: "14:32",
  personnel: 3,
  status: "ACTIVE",
  lifecycle: "OPEN",
  dataState: "SIMULATED",
  response: {
    vehicle: "SV-04",
    distance: "12.4 km",
    eta: "38 minutes",
    actions: [
      "Dispatch SV-04 after route validation",
      "Halt all zone movement — hold current position",
      "Notify expedition commander (Dr. V. Roy)",
      "Verify personnel safety and shelter status",
      "Monitor whiteout density until window reopens",
    ],
  },
  simulated: true,
};

/* 9-step whiteout response chain (Emergency Center demo flow) */
export const WHITEOUT_STEPS = [
  { label: "Incident detected", detail: "ANT-09 whiteout beacon triggered at Research Zone B — visibility below 100 m", auto: true },
  { label: "Personnel identified", detail: "3-member team · lead Dr. Vikram Roy — all accounted for, sheltered in place", auto: true },
  { label: "Nearby assets checked", detail: "SV-04 nearest capable asset — 12.4 km from Zone B at Maitri QRF pad", auto: true },
  { label: "Route validated", detail: "Ridge A corridor clear of crevasse field — validated against simulated ice-penetrating radar", auto: false },
  { label: "Resources checked", detail: "SV-04 fuel 90% · rescue winch verified 05 Sep · 2 medics + trauma kit aboard", auto: true },
  { label: "Recommendation generated", detail: "Dispatch SV-04 after route validation — ETA 38 min via Ridge A corridor", auto: true },
  { label: "Human approval", detail: "Directorate authorization required — AI proposes, humans decide", auto: false },
  { label: "Dispatch", detail: "SV-04 rolling from Maitri QRF pad — convoy track logged", auto: true },
  { label: "Incident status updated", detail: "ANT-09 advised to hold position — incident record updated for all modules", auto: true },
];

export const INCIDENT_STATUSES = ["DETECTED", "ASSESSED", "APPROVED", "DISPATCHED", "RESPONDING", "RESOLVED"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number] | "ACTIVE";

/* ------------------------------------------------------------------ */
/* Cargo & Shipments                                                   */
/* ------------------------------------------------------------------ */

export type CargoStatus = "IN TRANSIT" | "LOADING" | "DELIVERED" | "DELAYED";
export type CargoPriority = "CRITICAL" | "HIGH" | "NORMAL";

export interface CargoTimelineStep {
  step: string;
  time?: string;
  /* STEP 4.2 — machine-readable stamp; drives dual time + PAST/TODAY/FUTURE */
  timestamp?: string;
  done: boolean;
  current?: boolean;
  /** true for steps that have NOT happened yet (planned future work) */
  planned?: boolean;
}

export interface CargoConsignment {
  id: string;
  description: string;
  weight: string;
  origin: string;
  destination: string;
  priority: CargoPriority;
  status: CargoStatus;
  eta: string;
  /* STEP 4.2 — ISO arrival so date checks are computable */
  etaIso?: string;
  carrier: string;
  assignedExpedition?: string;
  assignedMission?: string;
  manifest: { item: string; qty: string }[];
  timeline: CargoTimelineStep[];
  note?: string;
}

/**
 * STEP 4.2 — timeline date-consistency validator.
 * Catches exactly the audit's bug class: something marked PLANNED whose
 * timestamp already passed, and live shipments whose ETA has slipped
 * into the past while still showing "on its way".
 */
export function validateTimeline(consignments: CargoConsignment[]): string[] {
  const errors: string[] = [];
  const now = getNow();
  for (const cargo of consignments) {
    for (const event of cargo.timeline) {
      if (event.planned && event.timestamp && new Date(event.timestamp) < now) {
        errors.push(`${cargo.id} step "${event.step}" is planned but its timestamp is in the past`);
      }
      if (!event.done && !event.planned && event.timestamp && new Date(event.timestamp) < now) {
        errors.push(`${cargo.id} step "${event.step}" is not done but has no planned flag and its timestamp is in the past`);
      }
    }
    if (cargo.status !== "DELIVERED" && cargo.etaIso && new Date(cargo.etaIso) < now) {
      errors.push(`${cargo.id} is ${cargo.status} but its ETA (${cargo.etaIso}) is in the past`);
    }
  }
  return errors;
}

export const CARGO: CargoConsignment[] = [
  {
    id: "CG-104",
    description: "Medical Supplies",
    weight: "420 kg",
    origin: "Cape Town",
    destination: "Maitri",
    priority: "HIGH",
    status: "IN TRANSIT",
    /* STEP 4.2 — was "16 Sep" while the scenario day is 18 Sep: a vessel
       "on its way" cannot have arrived 2 days ago. ETA moved to 20 Sep. */
    eta: "20 Sep · 09:30 IST",
    etaIso: "2026-09-20T09:30:00+05:30",
    carrier: "Vessel · Ocean Quest (ice-edge transfer)",
    assignedExpedition: "ANT-08",
    assignedMission: "EXP-409",
    manifest: [
      { item: "Trauma kits (sealed)", qty: "12 units" },
      { item: "Tele-medicine consumables", qty: "48 line items" },
      { item: "Cold-chain antibiotics", qty: "6 cold boxes" },
      { item: "Expedition medical reserves", qty: "30 line items" },
    ],
    timeline: [
      { step: "Prepared", time: "10 Sep · 14:05 SAST", timestamp: "2026-09-10T14:05:00+02:00", done: true },
      { step: "Loaded", time: "11 Sep · 08:40 SAST", timestamp: "2026-09-11T08:40:00+02:00", done: true },
      { step: "In Transit", time: "Since 11 Sep · 21:15 SAST", timestamp: "2026-09-11T21:15:00+02:00", done: true, current: true },
      { step: "Arrived", time: "20 Sep · 09:30 IST (planned)", timestamp: "2026-09-20T09:30:00+05:30", done: false, planned: true },
    ],
    note: "Cold chain verified at last port inspection — 6 cold boxes logged at -18°C.",
  },
  {
    id: "CG-118",
    description: "Fuel Drums",
    weight: "1,200 kg",
    origin: "Cape Town",
    destination: "Bharati",
    priority: "CRITICAL",
    status: "LOADING",
    eta: "19 Sep · harbor ops window",
    etaIso: "2026-09-19T09:00:00+05:30",
    carrier: "Vessel · cargo hold 2 (bunkering)",
    assignedExpedition: "ANT-10",
    assignedMission: "EXP-410",
    manifest: [
      { item: "AN-76 fuel drums", qty: "48 drums × 200 L" },
      { item: "Drum trolleys & spill kit", qty: "4 sets" },
      { item: "Generator belts (bundle)", qty: "18 items" },
    ],
    timeline: [
      { step: "Prepared", time: "12 Sep · 10:20 SAST", timestamp: "2026-09-12T10:20:00+02:00", done: true },
      { step: "Loaded", time: "19 Sep · crane slot (planned)", timestamp: "2026-09-19T09:00:00+05:30", done: false, current: true, planned: true },
      { step: "In Transit", done: false, planned: true },
      { step: "Arrived", done: false, planned: true },
    ],
    note: "Loading under way at Cape Town — crane slot confirmed for the 19 Sep harbor window.",
  },
  {
    id: "CG-127",
    description: "Scientific Equipment",
    weight: "680 kg",
    origin: "Maitri",
    destination: "Zone B",
    priority: "NORMAL",
    status: "DELIVERED",
    eta: "Delivered 12 Sep · 11:20 IST",
    carrier: "Traverse · SNOWCAT-07 shuttle",
    assignedExpedition: "ANT-09",
    assignedMission: "EXP-411",
    manifest: [
      { item: "GPR survey rig", qty: "1 crate" },
      { item: "Ice-core barrels & heads", qty: "6 units" },
      { item: "Sample cold storage", qty: "2 units" },
      { item: "Field spectrometer", qty: "1 crate" },
    ],
    timeline: [
      { step: "Prepared", time: "09 Sep · 09:10 IST", timestamp: "2026-09-09T09:10:00+05:30", done: true },
      { step: "Loaded", time: "10 Sep · 07:45 IST", timestamp: "2026-09-10T07:45:00+05:30", done: true },
      { step: "In Transit", time: "10–12 Sep · traverse log", timestamp: "2026-09-10T08:00:00+05:30", done: true },
      { step: "Arrived", time: "12 Sep · 11:20 IST", timestamp: "2026-09-12T11:20:00+05:30", done: true },
    ],
    note: "Signed off by ANT-09 field lead — equipment staged at Zone B camp.",
  },
  {
    id: "CG-131",
    description: "Spare Parts",
    weight: "310 kg",
    origin: "Cape Town",
    destination: "Maitri",
    priority: "HIGH",
    status: "DELAYED",
    eta: "TBD — customs hold, est. +36 h",
    carrier: "Vessel · Ocean Quest (held at port)",
    assignedExpedition: "ANT-09",
    assignedMission: "EXP-411",
    manifest: [
      { item: "ATV track-link kits", qty: "6 kits" },
      { item: "Coolant lines & clamps", qty: "22 items" },
      { item: "Generator belts", qty: "18 items" },
      { item: "Radar de-ice elements", qty: "8 units" },
    ],
    timeline: [
      { step: "Prepared", time: "08 Sep · 16:30 SAST", timestamp: "2026-09-08T16:30:00+02:00", done: true },
      { step: "Loaded", time: "09 Sep · 11:15 SAST", timestamp: "2026-09-09T11:15:00+02:00", done: true },
      { step: "In Transit", done: false, current: true },
      { step: "Arrived", done: false, planned: true },
    ],
    note: "Delayed 36 h at Cape Town — customs documentation hold. Carries ATV-021 track-link kits required for its overdue maintenance; blocks the spare-parts resupply line.",
  },
];

/* ------------------------------------------------------------------ */
/* Personnel movement                                                  */
/* ------------------------------------------------------------------ */

export interface PersonnelUnit {
  id: string;
  unit: string;
  lead: string;
  count: number;
  expeditionId: string;
  expeditionCode: string;
  currentLocation: string;
  previousLocation: string;
  lastCheckIn: string;
  status: OpStatus;
  vitals: { temp: string; pulse: string; power: string };
  movementHistory: { place: string; time: string; tone: "info" | "warn" | "alert" | "ok"; note?: string }[];
  /* STEP 5.1 — two DIFFERENT timestamps, never combined:
     lastPositionReceivedAt = when the GPS beacon was last heard
     lastCommunicationAt    = when they last confirmed they are safe */
  lastPositionReceivedAt?: string;
  lastCommunicationAt?: string;
  positionState?: PositionState;
  checkInState?: CheckInState;
}

/* STEP 5.1 — separate derived states with explicit rules:
   position: FRESH <1h · STALE 1–4h · LOST >4h (red after 4h without position)
   check-in: OK <15m · OVERDUE 15m–4h · MISSING >4h (alert after 15m) */
export type PositionState = "FRESH" | "STALE" | "LOST";
export type CheckInState = "OK" | "OVERDUE" | "MISSING";

export function positionStateOf(hoursAgo: number): PositionState {
  if (hoursAgo < 1) return "FRESH";
  if (hoursAgo <= 4) return "STALE";
  return "LOST";
}

export function checkInStateOf(minutesAgo: number): CheckInState {
  if (minutesAgo < 15) return "OK";
  if (minutesAgo <= 240) return "OVERDUE";
  return "MISSING";
}

export const PERSONNEL_UNITS: PersonnelUnit[] = [
  {
    id: "unit-09",
    unit: "ANT-09 · Geological Grid Team",
    lead: "Dr. Vikram Roy",
    count: 3,
    expeditionId: "ant-09",
    expeditionCode: "ANT-09",
    currentLocation: "Geological Grid",
    previousLocation: "Research Zone B",
    lastCheckIn: "31 min ago",
    status: "ATTENTION",
    vitals: { temp: "-38.2°", pulse: "81 bpm", power: "64%" },
    movementHistory: [
      { place: "Maitri Station", time: "20 Aug · 06:40", tone: "info", note: "Departed on EXP-411 traverse plan" },
      { place: "Waypoint W-2", time: "20 Aug · 14:15", tone: "info", note: "Convoy regroup, fuel top-up +40 L" },
      { place: "Research Zone B", time: "12 Sep · 10:15", tone: "warn", note: "Weather watch — gust front inbound" },
      { place: "Geological Grid", time: "12 Sep · 13:04", tone: "alert", note: "Current position · check-in overdue vs 15-min protocol" },
    ],
  },
  {
    id: "unit-07",
    unit: "ANT-07 · Zone B Survey Team",
    lead: "Dr. Arjun Mehta",
    count: 6,
    expeditionId: "ant-07",
    expeditionCode: "ANT-07",
    currentLocation: "Research Zone B",
    previousLocation: "Maitri Station",
    lastCheckIn: "12 min ago",
    status: "OPERATIONAL",
    vitals: { temp: "-31.4°", pulse: "74 bpm", power: "92%" },
    movementHistory: [
      { place: "Base Camp", time: "07 Aug · 06:10", tone: "info", note: "Mission start · manifest closed" },
      { place: "Maitri Station", time: "15 Aug · 09:30", tone: "ok", note: "Rotation exchange completed" },
      { place: "Research Zone B", time: "10 Sep · 08:00", tone: "info", note: "Current position · survey transect 6/9" },
    ],
  },
  {
    id: "unit-08",
    unit: "ANT-08 · Ridge Transect Team",
    lead: "Dr. Priya Nair",
    count: 4,
    expeditionId: "ant-08",
    expeditionCode: "ANT-08",
    currentLocation: "Maitri Ridge · local transects",
    previousLocation: "Maitri Station",
    lastCheckIn: "8 min ago",
    status: "OPERATIONAL",
    vitals: { temp: "-24.8°", pulse: "71 bpm", power: "96%" },
    movementHistory: [
      { place: "Maitri Station", time: "03 Aug · 05:45", tone: "info", note: "Departed for ridge transect network" },
      { place: "Snow density line 12", time: "11 Sep · 10:02", tone: "info", note: "Transect 12 of 18 completed" },
      { place: "Maitri Ridge", time: "12 Sep · 07:30", tone: "ok", note: "Current position · nominal" },
    ],
  },
  {
    id: "unit-10",
    unit: "ANT-10 · Hydrographic Watch",
    lead: "Cdr. Rahul Verma",
    count: 9,
    expeditionId: "ant-10",
    expeditionCode: "ANT-10",
    currentLocation: "Southern Ocean · grid SO-9",
    previousLocation: "Ice edge corridor",
    lastCheckIn: "5 min ago",
    status: "OPERATIONAL",
    vitals: { temp: "-6.1°", pulse: "68 bpm", power: "98%" },
    movementHistory: [
      { place: "Port scrutiny · Cape Town", time: "31 Jul · 09:00", tone: "info", note: "Departed harbor" },
      { place: "Ice edge corridor", time: "08 Aug · 06:20", tone: "info", note: "Entered survey approach" },
      { place: "Survey grid SO-9", time: "20 Aug · 11:40", tone: "ok", note: "Current position · CTD cast 22/30" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Mission Comms (operational traffic, not a chat app)                 */
/* ------------------------------------------------------------------ */

export type CommPriority = "NORMAL" | "HIGH" | "EMERGENCY";

export interface CommMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  time: string;
  priority: CommPriority;
  status: "DELIVERED" | "QUEUED" | "SYNCING";
  channel: string;
}

export const COMMS_SEED: CommMessage[] = [
  {
    id: "MSG-1181",
    from: "ANT-09",
    to: "COMMAND",
    text: "Visibility dropping near Zone B. Request movement guidance.",
    time: "14:21",
    priority: "HIGH",
    status: "DELIVERED",
    channel: "Iridium",
  },
  {
    id: "MSG-1182",
    from: "COMMAND",
    to: "ANT-09",
    text: "Movement halted. Remain at current position.",
    time: "14:23",
    priority: "EMERGENCY",
    status: "DELIVERED",
    channel: "SATCOM",
  },
  {
    id: "MSG-1183",
    from: "LOGISTICS",
    to: "COMMAND",
    text: "SV-04 available for dispatch.",
    time: "14:26",
    priority: "NORMAL",
    status: "DELIVERED",
    channel: "Station LAN",
  },
  {
    id: "MSG-1184",
    from: "COMMAND",
    to: "ALL UNITS",
    text: "Whiteout advisory — suspend sledge movements until the 18:00 met uplink. Report position on next scheduled check-in.",
    time: "14:30",
    priority: "HIGH",
    status: "DELIVERED",
    channel: "SATCOM broadcast",
  },
];

export const COMMS_RECIPIENTS = ["ANT-09", "ANT-07", "ANT-08", "ANT-10", "LOGISTICS", "ALL UNITS"];

/* Data provenance (shown on panels so judges can see data age & source) */
export const PROVENANCE = {
  updated: "Updated 2 min ago",
  source: "From: demo data",
  confidence: "Demo score: high (not calibrated)",
};

/* ------------------------------------------------------------------ */
/* Map                                                                 */
/* ------------------------------------------------------------------ */

export interface MapMarker {
  id: string;
  kind: "vessel" | "station" | "vehicle" | "remote";
  icon: string;
  x: number;
  y: number;
  label: string;
  lines: { k: string; v: string; tone?: "ok" | "warn" | "alert" }[];
  assetId?: string;
  expeditionId?: string;
}

export const MAP_MARKERS: MapMarker[] = [
  {
    id: "m-oceanquest",
    kind: "vessel",
    icon: "vessel",
    x: 428,
    y: 84,
    label: "OCEAN QUEST",
    lines: [
      { k: "Expedition", v: "ANT-07" },
      { k: "Status", v: "ACTIVE", tone: "ok" },
      { k: "Personnel", v: "31" },
      { k: "Fuel", v: "78%" },
    ],
    expeditionId: "ant-07",
  },
  {
    id: "m-maitri",
    kind: "station",
    icon: "station",
    x: 356,
    y: 168,
    label: "MAITRI STATION",
    lines: [
      { k: "Status", v: "OPERATIONAL", tone: "ok" },
      { k: "Personnel", v: "48" },
      { k: "Supplies", v: "64%" },
      { k: "Power", v: "Grid + GEN backup" },
    ],
  },
  {
    id: "m-bharati",
    kind: "station",
    icon: "station",
    x: 448,
    y: 206,
    label: "BHARATI STATION",
    lines: [
      { k: "Status", v: "OPERATIONAL", tone: "ok" },
      { k: "Personnel", v: "35" },
      { k: "Supplies", v: "71%" },
      { k: "Power", v: "98% · renewables" },
    ],
  },
  {
    id: "m-zoneb",
    kind: "remote",
    icon: "zone",
    x: 306,
    y: 238,
    label: "RESEARCH ZONE B",
    lines: [
      { k: "Mission", v: "EXP-411 · Zone B Survey" },
      { k: "Field site", v: "ANT-07 / ANT-09" },
      { k: "Weather risk", v: "HIGH", tone: "alert" },
      { k: "Teams on site", v: "57" },
    ],
    expeditionId: "ant-09",
  },
  {
    id: "m-atv021",
    kind: "vehicle",
    icon: "vehicle",
    x: 336,
    y: 266,
    label: "ATV-021",
    lines: [
      { k: "Type", v: "All-Terrain Vehicle" },
      { k: "Status", v: "MAINTENANCE", tone: "warn" },
      { k: "Health", v: "58%" },
      { k: "Assigned", v: "ANT-09" },
    ],
    assetId: "ATV-021",
  },
  {
    id: "m-sv04",
    kind: "vehicle",
    icon: "vehicle",
    x: 402,
    y: 184,
    label: "SV-04",
    lines: [
      { k: "Type", v: "Support Vehicle (QRF)" },
      { k: "Status", v: "STANDBY", tone: "ok" },
      { k: "Health", v: "96%" },
      { k: "Posture", v: "Maitri QRF pad" },
    ],
    assetId: "SV-04",
  },
  {
    id: "m-drone104",
    kind: "vehicle",
    icon: "drone",
    x: 320,
    y: 146,
    label: "DRONE-104",
    lines: [
      { k: "Type", v: "Survey UAV" },
      { k: "Status", v: "OPERATIONAL", tone: "ok" },
      { k: "Battery", v: "82%" },
      { k: "Assigned", v: "ANT-07" },
    ],
    assetId: "DRONE-104",
  },
  {
    id: "m-aws12",
    kind: "remote",
    icon: "satellite",
    x: 172,
    y: 396,
    label: "AWS-12",
    lines: [
      { k: "Type", v: "Remote Weather Station" },
      { k: "Status", v: "OPERATIONAL", tone: "ok" },
      { k: "Battery", v: "55%" },
      { k: "Uplink", v: "Iridium · 20 min" },
    ],
    assetId: "AWS-12",
  },
];

/* Route ANT-07: Maitri → Research Zone B → Bharati (vessel offshore) */
export const MAP_ROUTE = [
  { x: 356, y: 168 },
  { x: 306, y: 238 },
  { x: 448, y: 206 },
];

/* ------------------------------------------------------------------ */
/* AI Decision Assistant                                               */
/* ------------------------------------------------------------------ */

export interface AssistantAnswer {
  id: string;
  question: string;
  keywords: string[];
  verdict: string;
  reasons: string[];
  actions: string[];
  priority: Priority;
  link?: { label: string; view: View; expeditionId?: string; assetId?: string };
}

export const SUGGESTED_QUESTIONS = [
  "Which expedition needs immediate attention?",
  "Which asset can support ANT-09?",
  "When should Zone B be resupplied?",
  "Why is ATV-021 flagged?",
  "What is the weather outlook near Research Zone B?",
  "Summarize today's critical alerts.",
];

export const ASSISTANT_ANSWERS: AssistantAnswer[] = [
  {
    id: "q-exp-attention",
    question: "Which expedition needs immediate attention?",
    keywords: ["needs", "immediate", "attention", "expedition", "which"],
    verdict: "ANT-09 requires attention due to delayed check-in and elevated weather risk.",
    reasons: [
      "Last check-in from the Geological Grid team is 31 minutes old — above the 15-minute protocol",
      "Whiteout probability near Research Zone B has risen to 64% over the next 24 h",
      "Same risk cluster: oxygen buffer at 6 days and ATV-021 maintenance overdue",
    ],
    actions: [
      "Open EXP-411 / ANT-09 detail and review the movement window",
      "Hold further Zone B legs until the weather window reopens",
      "Pre-stage SV-04 at the Maitri QRF pad for a possible dispatch",
    ],
    priority: "HIGH",
    link: { label: "Open EXP-411 · ANT-09 detail", view: "expeditions", expeditionId: "ant-09" },
  },
  {
    id: "q-support-ant09",
    question: "Which asset can support ANT-09?",
    keywords: ["support", "ant-09", "asset", "which", "can"],
    verdict: "SV-04 is currently available, with 90% fuel and a verified rescue winch.",
    reasons: [
      "SV-04 is staged at the Maitri QRF pad — 12.4 km from Zone B, status STANDBY",
      "Fuel at 90% covers the round trip with a safe reserve margin",
      "Rescue winch load-tested and verified on 05 Sep; 2 medics + trauma kit aboard",
    ],
    actions: [
      "Validate the Ridge A route, then dispatch SV-04 from the Emergency Center",
      "Keep SNOWCAT-07 as secondary recovery option",
      "Notify ANT-09 lead of the dispatch ETA once approved",
    ],
    priority: "HIGH",
    link: { label: "Open Emergency Center", view: "emergency" },
  },
  {
    id: "q-resupply-when",
    question: "When should Zone B be resupplied?",
    keywords: ["when", "resupplied", "zone b", "resupply", "should"],
    verdict:
      "Oxygen is projected to reach its operational threshold in approximately 6 days. Resupply is recommended before the threshold is reached.",
    reasons: [
      "Zone B cache is drawing 62 units/day against a 52-unit forecast",
      "420 units on hand breach the 60-unit operational buffer in ~6 days",
      "Next scheduled transfer (SY-118) departs in 3 days — inside the window",
    ],
    actions: [
      "Approve the oxygen resupply recommendation in Inventory & Logistics",
      "Bind 120 O2 units to the SY-118 manifest",
      "Re-forecast consumption once ANT-09 returns to Maitri",
    ],
    priority: "HIGH",
    link: { label: "Open Inventory & Logistics", view: "logistics" },
  },
  {
    id: "q-atv-flagged",
    question: "Why is ATV-021 flagged?",
    keywords: ["atv-021", "flagged", "why"],
    verdict:
      "Maintenance is 9 days overdue and the coolant trend has increased by 14%. Prototype risk scoring recommends inspection before the next mission leg.",
    reasons: [
      "Preventive maintenance was due 28 Aug — now 9 days overdue",
      "Coolant temperature trend +14% across the last 5 sorties",
      "Prototype risk scoring: HIGH failure risk within ~3 operating days",
    ],
    actions: [
      "Schedule inspection before the next mission leg",
      "Raise a field work order in the Assets registry",
      "Note: required track-link kits are aboard delayed consignment CG-131",
    ],
    priority: "HIGH",
    link: { label: "Open ATV-021 in Assets", view: "assets", assetId: "ATV-021" },
  },
  {
    id: "q-attention",
    question: "Which expedition requires immediate attention?",
    keywords: ["expedition", "requires", "focus", "team", "priority"],
    verdict: "ANT-09 (Geological Survey) currently requires the most attention.",
    reasons: [
      "Oxygen reserve is below the recommended operational buffer (42% · 6 days to breach)",
      "ATV-021 assigned to ANT-09 requires maintenance — 9 days overdue",
      "Weather risk near Research Zone B is increasing (whiteout probability 64% / 24 h)",
    ],
    actions: [
      "Initiate oxygen resupply on the 14 Sep transfer",
      "Inspect ATV-021 before the next movement leg",
      "Review route conditions before any further movement from Zone B",
    ],
    priority: "HIGH",
    link: { label: "Open ANT-09 detail", view: "expeditions", expeditionId: "ant-09" },
  },
  {
    id: "q-supplies",
    question: "What supplies are at risk?",
    keywords: ["supply", "supplies", "inventory", "stock", "oxygen", "food", "risk", "resupply"],
    verdict: "Oxygen is the only CRITICAL supply line; food and spare parts are on watch.",
    reasons: [
      "OXYGEN — 420 units at 62/day consumption, projected threshold breach in 6 days",
      "FOOD — 64% level, projected breach of minimum buffer in 11 days",
      "SPARE PARTS — 57% level; ATV track links and generator belts are short",
    ],
    actions: [
      "Generate a resupply recommendation for oxygen ( Logistics page )",
      "Add ATV track-link kits to the 14 Sep transfer manifest",
      "Re-forecast food once ANT-09 returns to Maitri",
    ],
    priority: "HIGH",
    link: { label: "Open Logistics & Supply", view: "logistics" },
  },
  {
    id: "q-assets",
    question: "Which assets require maintenance?",
    keywords: ["asset", "maintenance", "repair", "vehicle", "atv", "drone", "radar", "generator"],
    verdict: "Three assets require attention: ATV-021, RADAR-009 and CONT-442.",
    reasons: [
      "ATV-021 — maintenance 9 days overdue, coolant trend +14%, failure risk HIGH",
      "RADAR-009 — calibration drift 0.4 dB over 14 days, re-alignment suggested in 11 days",
      "CONT-442 — thermal seal degraded, cargo transfer recommended within 6 days",
    ],
    actions: [
      "Raise a maintenance work order for ATV-021",
      "Schedule RADAR-009 re-alignment during the next Bharati window",
      "Relocate sensitive cargo out of CONT-442",
    ],
    priority: "HIGH",
    link: { label: "Open Asset registry", view: "assets" },
  },
  {
    id: "q-alerts",
    question: "Summarize today's critical alerts.",
    keywords: ["alert", "alerts", "summar", "today", "situation", "report"],
    verdict: "Three alerts are active: one CRITICAL, two WARNING.",
    reasons: [
      "CRITICAL 08:20 — High weather risk near Research Zone B (whiteout probability 64%)",
      "WARNING 10:42 — Oxygen reserves projected below threshold in 6 days",
      "WARNING 09:05 — ATV-021 maintenance overdue",
    ],
    actions: [
      "Review ANT-09 movement windows against the gust front ETA",
      "Approve the oxygen resupply recommendation",
      "Flag ATV-021 for inspection before next leg",
    ],
    priority: "MEDIUM",
    link: { label: "Open Command Center", view: "command" },
  },
  {
    id: "q-commander",
    question: "What action should the commander take?",
    keywords: ["commander", "action", "should", "recommend", "take", "next", "decision"],
    verdict: "Prioritise the ANT-09 field team: oxygen, weather and vehicle form one risk cluster.",
    reasons: [
      "Oxygen buffer, ATV-021 reliability and the Zone B gust front all affect ANT-09 within the same 72-hour window",
      "ANT-07 / ANT-10 remain inside nominal operating parameters",
    ],
    actions: [
      "Hold further Zone B movement until the weather window re-opens",
      "Dispatch SV-04 with oxygen top-up for the Zone B teams",
      "Confirm the 14 Sep transfer adds 120 oxygen units",
    ],
    priority: "HIGH",
    link: { label: "Open Emergency Center", view: "emergency" },
  },
  {
    id: "q-weather",
    question: "What is the weather outlook near Research Zone B?",
    keywords: ["weather", "wind", "whiteout", "zone b", "forecast", "gust", "storm"],
    verdict: "Deteriorating outlook near Research Zone B over the next 24 hours.",
    reasons: [
      "Katabatic gust front approaching from the east ridge line",
      "Whiteout probability rising to 64% within 24 h",
      "AWS-12 reports sustained winds building from 18 to 34 kt",
    ],
    actions: [
      "Suspend sledge movements until conditions ease",
      "Anchor tents and secure CONT-442 cargo",
      "Re-check the met model at the 18:00 uplink",
    ],
    priority: "MEDIUM",
    link: { label: "Open ANT-09 detail", view: "expeditions", expeditionId: "ant-09" },
  },
  {
    id: "q-emergency",
    question: "How would POLAR-X respond to an emergency?",
    keywords: ["emergency", "incident", "response", "failure", "rescue", "safety", "sos"],
    verdict: "POLAR-X pairs incident detection with an auto-generated response package.",
    reasons: [
      "The system identifies the nearest QRF asset (currently SV-04 at Maitri)",
      "It computes distance, ETA and a 5-step response plan",
      "Dispatch actions update the incident record and notify the commander",
    ],
    actions: [
      "Open the Emergency Center to run the simulation",
      "Trigger SIMULATE EMERGENCY to see the response package",
      "Use DISPATCH SUPPORT to execute the recommended plan",
    ],
    priority: "MEDIUM",
    link: { label: "Open Emergency Center", view: "emergency" },
  },
];

export const ASSISTANT_FALLBACK: AssistantAnswer = {
  id: "q-fallback",
  question: "Operational query",
  keywords: [],
  verdict:
    "Here is the current operational picture based on simulated POLAR-X data.",
  reasons: [
    "1 of 4 expeditions (ANT-09) is flagged ATTENTION with a HIGH risk level",
    "Oxygen is the binding constraint — 6 days to projected threshold breach",
    "ATV-021 and CONT-442 are the assets driving equipment risk this week",
  ],
  actions: [
    "Ask about a specific domain: supplies, assets, weather, alerts or an expedition",
    "Or run the Emergency Center simulation to see response planning",
  ],
  priority: "ROUTINE",
};

/* ------------------------------------------------------------------ */
/* Command center KPIs + schedule                                      */
/* ------------------------------------------------------------------ */

export const KPIS = [
  { label: "ACTIVE EXPEDITIONS", value: "04", trend: "4 of 4 mission plans on schedule", tone: "ice" as const },
  { label: "PERSONNEL", value: "127", trend: "+6 rotated in this week", tone: "ice" as const },
  { label: "TOTAL ASSETS", value: "386", trend: "10 shown in registry demo view", tone: "ice" as const },
  { label: "CRITICAL ALERTS", value: "03", trend: "1 critical · 2 warning", tone: "warn" as const },
];

export const OPERATIONS_SCHEDULE = [
  /* STEP 4 — schedule entries are upcoming work; stale past dates replaced */
  { time: "24 SEP", text: "Scheduled supply transfer — sorties SY-118 / SY-119 to Maitri", tag: "LOGISTICS" },
  { time: "26 SEP", text: "ANT-10 grid SO-9 completion checkpoint (cast 30 of 30)", tag: "OPERATIONS" },
  { time: "25 SEP", text: "RADAR-009 re-alignment window at Bharati", tag: "MAINTENANCE" },
  { time: "27 SEP", text: "ANT-07 arrival Bharati — personnel rotation exchange", tag: "OPERATIONS" },
];

export const ENVIRONMENT = {
  temp: "-34°C",
  wind: "28 kt NE",
  visibility: "9 km",
  station: "MAITRI · 70.77°S 11.73°E",
  seaIce: "Pack ice edge 41 km N",
};

/* ------------------------------------------------------------------ */
/* Field unit live vitals (per expedition)                             */
/* ------------------------------------------------------------------ */

export interface UnitVital {
  expeditionId: string;
  code: string;
  callsign: string;
  temp: string;
  pulse: string;
  power: string;
  checkIn: string;
  status: OpStatus;
}

export const UNIT_VITALS: UnitVital[] = [
  { expeditionId: "ant-07", code: "ANT-07", callsign: "Zone B Survey", temp: "-31.4°", pulse: "74 bpm", power: "92%", checkIn: "12m", status: "OPERATIONAL" },
  { expeditionId: "ant-08", code: "ANT-08", callsign: "Maitri Ridge", temp: "-24.8°", pulse: "71 bpm", power: "96%", checkIn: "8m", status: "OPERATIONAL" },
  { expeditionId: "ant-09", code: "ANT-09", callsign: "Geological Grid", temp: "-38.2°", pulse: "81 bpm", power: "64%", checkIn: "31m", status: "ATTENTION" },
  { expeditionId: "ant-10", code: "ANT-10", callsign: "SO-9 Grid", temp: "-6.1°", pulse: "68 bpm", power: "98%", checkIn: "5m", status: "OPERATIONAL" },
];

/* Per-expedition environmental readout (Expeditions detail tiles) */
export const EXPEDITION_ENV: Record<string, { temp: string; wind: string; visibility: string; comms: string }> = {
  "ant-07": { temp: "-31.4°C", wind: "26 kt SSW", visibility: "8.2 km", comms: "Iridium · Strong" },
  "ant-08": { temp: "-24.8°C", wind: "14 kt NE", visibility: "11.6 km", comms: "SATCOM · Strong" },
  "ant-09": { temp: "-38.2°C", wind: "38 kt E · Gusting", visibility: "2.4 km", comms: "Iridium AUX" },
  "ant-10": { temp: "-6.1°C", wind: "18 kt NW", visibility: "12.0 km", comms: "V-SAT · Strong" },
};

/* Crew biometric spot-reads for the expeditions detail panel */
export const EXPEDITION_CREW: Record<string, { name: string; role: string; hr: number; temp: string }[]> = {
  "ant-07": [
    { name: "Dr. Arjun Mehta", role: "EXPEDITION LEAD", hr: 74, temp: "36.8°C" },
    { name: "S. Iyer", role: "CHIEF MECH // ATV", hr: 79, temp: "36.7°C" },
    { name: "M. Sharma", role: "LOGISTICS SPEC", hr: 71, temp: "36.9°C" },
  ],
  "ant-08": [
    { name: "Dr. Priya Nair", role: "EXPEDITION LEAD", hr: 70, temp: "36.6°C" },
    { name: "K. Menon", role: "CLIMATE TECH", hr: 68, temp: "36.8°C" },
    { name: "R. Gupta", role: "FIELD SPEC", hr: 72, temp: "36.7°C" },
  ],
  "ant-09": [
    { name: "Dr. Vikram Roy", role: "EXPEDITION LEAD", hr: 83, temp: "36.9°C" },
    { name: "A. Das", role: "GEO TECH", hr: 86, temp: "37.0°C" },
    { name: "P. Singh", role: "SAFETY OFFICER", hr: 80, temp: "36.8°C" },
  ],
  "ant-10": [
    { name: "Cdr. Rahul Verma", role: "MISSION COMMAND", hr: 66, temp: "36.5°C" },
    { name: "S. Pillai", role: "HYDROGRAPHY", hr: 69, temp: "36.6°C" },
    { name: "J. Thomas", role: "DECK OPS", hr: 73, temp: "36.7°C" },
  ],
};

/* ------------------------------------------------------------------ */
/* Logistics — site inventory cards, fleet, weather windows            */
/* ------------------------------------------------------------------ */

export interface SiteStock {
  id: string;
  name: string;
  sub: string;
  risk: "NOMINAL" | "CAUTION" | "CRITICAL";
  headline: { k: string; v: string; tone?: "ok" | "warn" | "alert" };
  cells: { k: string; v: string; tone?: "ok" | "warn" | "alert" }[];
  footer: { k: string; v: string; tone?: "ok" | "warn" | "alert" };
}

export const SITE_STOCK: SiteStock[] = [
  {
    id: "site-maitri",
    name: "Maitri Station",
    sub: "SECTOR 1 · 70.77°S",
    risk: "NOMINAL",
    headline: { k: "Base reserve", v: "62% / Nominal", tone: "ok" },
    cells: [
      { k: "Fuel", v: "4,120 L" },
      { k: "Rations", v: "112 days" },
      { k: "Medical", v: "94% kit" },
    ],
    footer: { k: "Runway", v: "Blue ice · Open" },
  },
  {
    id: "site-bharati",
    name: "Bharati Station",
    sub: "SECTOR 2 · 69.40°S",
    risk: "NOMINAL",
    headline: { k: "Base reserve", v: "71% / Nominal", tone: "ok" },
    cells: [
      { k: "Fuel", v: "2,860 L" },
      { k: "Rations", v: "96 days" },
      { k: "Power", v: "98% renew" },
    ],
    footer: { k: "Helideck", v: "Operational" },
  },
  {
    id: "site-oceanquest",
    name: "Ocean Quest",
    sub: "ANT-07 / ANT-10 · SO-9",
    risk: "CAUTION",
    headline: { k: "Bunker plan", v: "78% / On sched", tone: "ok" },
    cells: [
      { k: "Fuel", v: "890 L" },
      { k: "Rations", v: "41 days" },
      { k: "Oxygen", v: "58%" },
    ],
    footer: { k: "Helo ops", v: "Window 14–18 UTC" },
  },
  {
    id: "site-zoneb",
    name: "Zone B Field Cache",
    sub: "RESEARCH ZONE B · ANT-07/09",
    risk: "CRITICAL",
    headline: { k: "Oxygen reserve", v: "420 units (28%)", tone: "alert" },
    cells: [
      { k: "Fuel", v: "270 L (34%)" },
      { k: "Rations", v: "17 days" },
      { k: "Filters", v: "DEPLETED", tone: "alert" },
    ],
    footer: { k: "Breach threshold", v: "6 days", tone: "alert" },
  },
];

export const RESUPPLY_FLEET = [
  {
    id: "SY-118",
    cls: "Air Sortie · Dornier",
    payload: "120 O2 units + medical",
    routing: "Maitri → Zone B cache",
    eta: "T-3 DAYS",
    status: "STANDBY (WX DELAY)",
    action: "DISPATCH OP",
  },
  {
    id: "SY-119",
    cls: "Traverse · Snowcat convoy",
    payload: "1.8kL fuel bladder + spares",
    routing: "Maitri → Zone B (-82.4°E)",
    eta: "EN ROUTE",
    status: "REROUTE (CREVASSE)",
    action: "CALC PATH",
  },
  {
    id: "SY-121",
    cls: "Vessel · Ocean Quest",
    payload: "Rations + science cargo",
    routing: "Ice edge → Bharati",
    eta: "ETA 3.2H",
    status: "ON SCHEDULE",
    action: "TRACK",
  },
];

export const WEATHER_WINDOWS = [
  {
    route: "Maitri → Zone B",
    chip: "CLOSED",
    tone: "alert" as const,
    conditions: "Katabatic front · whiteout probability 64%",
    wind: "38 kt gusting 52",
    reopen: "Reassess at 18:00 uplink",
  },
  {
    route: "Zone B → Bharati",
    chip: "MARGINAL",
    tone: "warn" as const,
    conditions: "High cirrus, temp -29°C",
    wind: "24 kt crosswind",
    reopen: "Convoy clearance: ELIGIBLE after 16:00",
  },
  {
    route: "Maitri → Bharati",
    chip: "OPEN",
    tone: "ok" as const,
    conditions: "Clear high ridge, ceiling unlimited",
    wind: "12 kt light",
    reopen: "Flight vector FL 180 · SKY-BRIDGE OPTION",
  },
];

/* ------------------------------------------------------------------ */
/* Mission log (command center mono stream)                            */
/* ------------------------------------------------------------------ */

export const MISSION_LOG: { time: string; tag: string; tone: "info" | "ok" | "warn" | "alert"; text: string }[] = [
  { time: "11:58:04Z", tag: "SAT-RELAY", tone: "info", text: "RISAT-2B synthetic aperture scan of Research Zone B completed (resolution 1.2 m). Rift delta +4.2 m." },
  { time: "11:55:41Z", tag: "ALARM", tone: "alert", text: "ZONEB_CACHE: oxygen draw 18% above forecast. POLAR-X projection flags threshold breach in 6 days." },
  { time: "11:47:12Z", tag: "ANT-08", tone: "info", text: "Aerosol optical depth telemetry burst received: 3.2 GB packaged for NCPOR ground station (proposed integration)." },
  { time: "11:40:08Z", tag: "MET-BUOY", tone: "warn", text: "AWS-12 automated weather station reports wind shear surge: 38 kt E. Visibility degraded to 2.4 km near Zone B." },
  { time: "11:35:19Z", tag: "ANT-07", tone: "ok", text: "Vehicle inspection completed on convoy ATV-017 / ATV-021. Ice-core barrel temp -49.6°C nominal." },
  { time: "11:21:56Z", tag: "ANT-10", tone: "ok", text: "CTD cast 22 of 30 completed at grid SO-9. Bathymetric swath +214 km² today." },
];

/* ------------------------------------------------------------------ */
/* Emergency — historical resolved ops + drill metadata                */
/* ------------------------------------------------------------------ */

export const HISTORICAL_OPS = [
  {
    id: "INC-1121",
    sector: "Maitri · ANT-08",
    crisis: "Generator phase load imbalance auto-corrected by power controller",
    asset: "GEN-012 (Power)",
    response: "01h 10m",
    resolution: "Phase rebalanced, load bank test scheduled at next service window.",
    outcome: "RESOLVED",
  },
  {
    id: "INC-1114",
    sector: "Ice edge · ANT-10",
    crisis: "DRONE-107 telemetry loss during squall; aircraft recovered manually",
    asset: "DRONE-107 (UAV)",
    response: "02h 05m",
    resolution: "Airframe recovered undamaged. Link-loss alerting threshold tightened.",
    outcome: "RESOLVED",
  },
  {
    id: "INC-1102",
    sector: "Zone B · ANT-07",
    crisis: "Sledge cargo shift during traverse — route halted 40 min",
    asset: "SNOWCAT-07",
    response: "01h 25m",
    resolution: "Cargo re-secured. Tie-down checklist added to traverse protocol.",
    outcome: "RESOLVED",
  },
  {
    id: "INC-1096",
    sector: "Bharati · ANT-08",
    crisis: "RADAR-009 radome de-ice cycle failure during storm",
    asset: "RADAR-009",
    response: "03h 40m",
    resolution: "Heater element replaced; spares stock updated (+2 elements).",
    outcome: "RESOLVED",
  },
];

export const EMERGENCY_DRILL = {
  ambient: "-41.2°C",
  ambientTrend: "Falling 1.8°C/hr",
  hypoWindow: "07h 42m",
  crewAtRisk: 3,
  crewLead: "Dr. Vikram Roy",
  commsBattery: 48,
  steps: [
    { step: "STEP 01", title: "Incident Assessment", detail: "Engine failure confirmed via telemetry. Internal heat decay modeled. Crew accounted for.", status: "VERIFIED 14:38 UTC" },
    { step: "STEP 02", title: "Resource Allocation", detail: "Assign skid-plane or surface convoy based on ETA and thermal envelope.", status: "SELECTION PENDING" },
    { step: "STEP 03", title: "Weather Window Routing", detail: "Blizzard corridor analysis: 42 kt headwinds at Ridge B vector.", status: "WINDOW 15:30–22:00" },
    { step: "STEP 04", title: "Two-Man Authorization", detail: "Directorate crypto-signature confirmation for rapid polar deployment.", status: "DUAL AUTH REQ" },
  ],
  metar: { wind: "29 kt", visibility: "400 m", wx: "Ice fog", update: "14:15 UTC UPDATE" },
};

export function assistantFor(text: string): AssistantAnswer {
  const t = text.toLowerCase();
  let best: AssistantAnswer | null = null;
  let bestScore = 0;
  for (const a of ASSISTANT_ANSWERS) {
    let score = 0;
    for (const kw of a.keywords) if (t.includes(kw)) score += kw.length;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best ?? ASSISTANT_FALLBACK;
}

/* ================================================================== */
/* Mission Operations layer — 5-domain status, provenance tags,        */
/* decision memory, feasible opportunities (SIH 2026 mission-ops spec) */
/* Story clock: the simulated day is 12 Sep 2026 — ages/ETAs below are */
/* expressed relative to that so the demo stays internally coherent.   */
/* ================================================================== */

export const MISSION_CONTEXT = {
  expedition: "EXP-411 · Zone B Survey",
  phase: "TRACK · Day 19 of 38",
  /* STEP 4 — the milestone was 14 Sep while the scenario runs mid-Sep:
     a "next big delivery" can't sit in the past. Moved to 24 Sep. */
  milestone: { label: "SY-118/119 supply transfer", date: "24 Sep", inDays: 6 },
  stationLead: "Cmdr. V. Vance",
};

/* STEP 7.1 — NEXT: what's coming up, max 3, sorted by due time.
   Kept next to NEEDS_ATTENTION so the Overview split stays coherent:
   NOW = needs a decision · NEXT = scheduled milestones · MONITOR = awareness. */
export interface NextUpItem {
  id: string;
  title: string;
  detail: string;
  dueIso?: string;
  dueLabel: string;
  action: string;
  view: View;
}

export const NEXT_UP: NextUpItem[] = [
  {
    id: "next-wx",
    title: "Weather window re-check for ANT-09",
    detail: "Movement hold is re-evaluated against the 18:00 met uplink",
    dueLabel: "Today · 18:00 IST",
    action: "Open plan",
    view: "expeditions",
  },
  {
    id: "next-cg104",
    title: "CG-104 medical supplies arrive at Maitri",
    detail: "Ice-edge transfer from Ocean Quest · cold chain verified",
    dueIso: "2026-09-20T09:30:00+05:30",
    dueLabel: "20 Sep · 09:30 IST",
    action: "Open shipment",
    view: "cargo",
  },
  {
    id: "next-sy118",
    title: "SY-118 / SY-119 supply transfer",
    detail: "120 oxygen units + rations to Maitri — approval pending",
    dueLabel: "24 Sep",
    action: "Review plan",
    view: "logistics",
  },
];

/* ---------------- 5-domain status (Mission Overview) ---------------- */

export type DomainKey = "planning" | "cargo" | "inventory" | "personnel" | "emergency";

export interface DomainStatus {
  key: DomainKey;
  name: string;
  state: "ok" | "warn" | "crit";
  headline: string; /* the 3-second line */
  detail: string;
  score: number; /* 0–100 domain readiness */
  age: string;
  source: string;
  view: View;
}

export const DOMAIN_STATUS: DomainStatus[] = [
  {
    key: "planning", name: "Planning", state: "warn", headline: "Zone B window closing",
    detail: "4 expeditions · ANT-09 movement window under review", score: 96,
    age: "15 min ago", source: "SIMULATED · expedition plans", view: "expeditions",
  },
  {
    key: "cargo", name: "Cargo", state: "warn", headline: "1 delay in the chain",
    detail: "CG-131 held at Cape Town · 3 shipments on the move", score: 74,
    age: "30 min ago", source: "SIMULATED · port ledger", view: "cargo",
  },
  {
    key: "inventory", name: "Inventory", state: "crit", headline: "Oxygen low — 6 days left",
    detail: "5 supply lines tracked · Zone B cache critical", score: 62,
    age: "12 min ago", source: "SIMULATED · stock ledger", view: "logistics",
  },
  {
    key: "personnel", name: "Personnel", state: "warn", headline: "1 check-in exception",
    detail: "127 on ice · ANT-09 grid team overdue", score: 93,
    age: "4 min ago", source: "SIMULATED · field check-ins", view: "personnel",
  },
  {
    key: "emergency", name: "Emergency", state: "ok", headline: "0 active incidents",
    detail: "Rescue team ready · practice drill available", score: 100,
    age: "live", source: "SIMULATED · SAR watch", view: "emergency",
  },
];

export function missionReadiness(domains: DomainStatus[] = DOMAIN_STATUS): number {
  return Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length);
}

/* ---------------- Needs Attention (max 3, priority-sorted) ---------- */

export interface AttentionItem {
  id: string;
  /* STEP 6 — canonical severity vocabulary (was "CRITICAL" | "WARNING") */
  severity: Severity;
  what: string;
  where: string;
  age: string;
  action: string;
  view: View;
  expeditionId?: string;
  assetId?: string;
  resupply?: SupplyKey;
  chain?: string[];
  chainSummary?: string;
  /* STEP 11 — rule citation */
  ruleId?: string;
  evaluatedCondition?: string;
  lastEvaluated?: string;
}

export const NEEDS_ATTENTION: AttentionItem[] = [
  {
    id: "attn-wx",
    severity: "CRITICAL",
    what: "Weather window closing at Zone B",
    where: "EXP-411 · ANT-09 Geological Grid",
    age: "25 min",
    action: "Review & reroute",
    view: "expeditions",
    expeditionId: "ant-09",
    ruleId: "R-08",
    evaluatedCondition: "clear-line-of-sight probability in the operating zone",
    lastEvaluated: todayIso("08:20"),
    chain: [
      "Planning — ANT-09 movement window closed pending the 18:00 uplink",
      "Cargo — CG-131 spare parts are in transit; the port hold adds to the delay",
      "Supplies — teams stuck in camp use 18% more oxygen; the buffer runs out in 6 days",
      "Personnel — ANT-09 grid team check-in overdue (31 min vs 15-min protocol)",
    ],
    chainSummary: "this also affects 3 other areas",
  },
  {
    id: "attn-oxy",
    severity: "HIGH",
    what: `Oxygen crosses its alert line in ${OXYGEN_FORECAST.daysUntilAlert} days`,
    where: "Zone B store · 62 units used per day",
    age: "1 h",
    action: "Recommend resupply",
    view: "logistics",
    resupply: "oxygen",
    ruleId: "R-02",
    evaluatedCondition: "stock of a tracked supply below its alert line (60 units)",
    lastEvaluated: todayIso("10:42"),
  },
  {
    id: "atv-atv",
    severity: "MEDIUM",
    what: "ATV-021 inspection overdue by 9 days",
    where: "Research Zone B · coolant trend +14%",
    age: "2 h",
    action: "Schedule inspection",
    view: "assets",
    assetId: "ATV-021",
    ruleId: "R-03",
    evaluatedCondition: "no valid inspection on record for 7 days",
    lastEvaluated: todayIso("09:05"),
  },
];

/* Cross-domain impact chains for the alert bell (spec feature C) */
export const ALERT_CHAINS: Record<string, { summary: string; impacts: string[] }> = {
  "alr-wx": {
    summary: "this also affects 3 other areas",
    impacts: [
      "Planning — ANT-09 movement window closed pending the 18:00 uplink",
      "Cargo — CG-131 spare parts are in transit; the port hold adds to the delay",
      "Inventory — Zone B oxygen draw +18%; buffer breach in 6 days",
      "Personnel — ANT-09 grid team check-in overdue (31 min)",
    ],
  },
  "alr-oxy": {
    summary: "this also affects 2 other areas",
    impacts: [
      "Assets — ATV-021 work order needs spares from delayed CG-131",
      "Personnel — rationing protocol triggers if the buffer is breached",
    ],
  },
  "alr-atv": {
    summary: "this also affects 1 other area",
    impacts: ["Cargo — expedite request raised for kits aboard CG-131"],
  },
};

/* ---------------- Institutional Memory Vault ---------------- */

export interface DecisionVersion {
  v: string;
  who: string;
  change: string;
  time: string;
}

export interface DecisionEntry {
  id: string;
  date: string;
  title: string;
  domain: "Planning" | "Cargo" | "Inventory" | "Personnel" | "Emergency";
  decision: string;
  context: { weather: string; assets: string; trigger: string };
  approvals: { name: string; role: string; action: string }[];
  versions: DecisionVersion[];
  retention: "ACTIVE" | "ARCHIVED";
  replay: string[];
}

export const DECISION_LOG: DecisionEntry[] = [
  {
    id: "DEC-1052",
    date: "08 Sep 2026 · 16:42",
    title: "Bind CG-131 spare-parts consignment to Ocean Quest voyage 26-09",
    domain: "Cargo",
    decision:
      "Load 6 ATV track-link kits, coolant lines and generator belts aboard Ocean Quest at Cape Town rather than waiting for the 22 Sep sailing.",
    context: {
      weather: "Cape Town winter gale clearing; berth ops normal",
      assets: "ATV-021 flagged 05 Sep — coolant trend +14%",
      trigger: "Spare-parts stock dipped to 57% with ATV-021 overdue",
    },
    approvals: [
      { name: "S. Iyer", role: "Logistics lead", action: "Prepared manifest" },
      { name: "Cmdr. V. Vance", role: "Ops director", action: "Authorized binding" },
    ],
    versions: [
      { v: "v1.0", who: "S. Iyer", change: "Manifest drafted", time: "08 Sep · 15:10" },
      { v: "v1.1", who: "Port agent", change: "Customs docs updated", time: "08 Sep · 16:05" },
      { v: "v1.2", who: "Cmdr. V. Vance", change: "Approved & bound to voyage", time: "08 Sep · 16:42" },
    ],
    retention: "ACTIVE",
    replay: [
      "v1.0 — manifest drafted with 48 line items",
      "v1.1 — customs hold detected, docs amended",
      "v1.2 — directorate sign-off, cargo bound",
    ],
  },
  {
    id: "DEC-1049",
    date: "05 Sep 2026 · 09:24",
    title: "Issue inspection advisory for ATV-021 instead of immediate recall",
    domain: "Planning",
    decision:
      "Keep ATV-021 on the ANT-09 survey grid with a restricted-movement advisory; inspect at camp before the next leg instead of recalling the vehicle mid-traverse.",
    context: {
      weather: "Zone B clear, whiteout probability low at decision time",
      assets: "ATV-021 health 58% · prototype risk score HIGH",
      trigger: "Predictive maintenance flag — 5 sorties of coolant trend",
    },
    approvals: [
      { name: "Dr. Vikram Roy", role: "ANT-09 lead", action: "Field concurrence" },
      { name: "Cmdr. V. Vance", role: "Ops director", action: "Approved advisory" },
    ],
    versions: [
      { v: "v1.0", who: "Asset engine", change: "Recall recommended", time: "05 Sep · 08:55" },
      { v: "v1.1", who: "Dr. Vikram Roy", change: "Field context added — survey window", time: "05 Sep · 09:10" },
      { v: "v1.2", who: "Cmdr. V. Vance", change: "Amended to advisory (human decision)", time: "05 Sep · 09:24" },
    ],
    retention: "ACTIVE",
    replay: [
      "Engine proposed recall; field lead cited survey completion",
      "Directorate amended to restricted-movement advisory",
    ],
  },
  {
    id: "DEC-1044",
    date: "02 Sep 2026 · 14:08",
    title: "Revise Zone B oxygen draw forecast to +18% over plan",
    domain: "Inventory",
    decision:
      "Adopt the observed 62 units/day draw for Zone B planning, superseding the 52 units/day forecast, and pull the resupply decision forward to the 14 Sep window.",
    context: {
      weather: "Early season cold snap; confinement likely",
      assets: "Zone B cache at 420 units",
      trigger: "Three consecutive days above forecast draw",
    },
    approvals: [
      { name: "M. Sharma", role: "Inventory control", action: "Raised revision" },
      { name: "Cmdr. V. Vance", role: "Ops director", action: "Approved revision" },
    ],
    versions: [
      { v: "v1.0", who: "Logistics engine", change: "Forecast 52/day", time: "20 Aug · 10:00" },
      { v: "v1.1", who: "M. Sharma", change: "Draw data attached (3 days)", time: "02 Sep · 13:50" },
      { v: "v1.2", who: "Cmdr. V. Vance", change: "62/day adopted for planning", time: "02 Sep · 14:08" },
    ],
    retention: "ARCHIVED",
    replay: [
      "Forecast overridden after 3 days of observed over-draw",
      "Resupply decision pulled forward by one window",
    ],
  },
  {
    id: "DEC-1038",
    date: "28 Aug 2026 · 11:30",
    title: "Reroute ANT-09 via Waypoint W-2 around crevasse cluster B-7",
    domain: "Planning",
    decision:
      "Traverse plan amended to pass Waypoint W-2, adding 6 km but avoiding crevasse cluster B-7 after the GPR sweep.",
    context: {
      weather: "Clear; visibility 11 km",
      assets: "GPR survey rig aboard SNOWCAT-07 shuttle",
      trigger: "GPR sweep detected cluster B-7 across the direct line",
    },
    approvals: [
      { name: "Dr. Vikram Roy", role: "ANT-09 lead", action: "Route amendment" },
      { name: "Safety board", role: "Maitri", action: "Concurrence" },
    ],
    versions: [
      { v: "v1.0", who: "Dr. Vikram Roy", change: "Direct route filed", time: "20 Aug · 07:00" },
      { v: "v1.1", who: "GPR team", change: "Cluster B-7 hazard layer added", time: "27 Aug · 17:20" },
      { v: "v1.2", who: "Safety board", change: "Reroute via W-2 approved", time: "28 Aug · 11:30" },
    ],
    retention: "ARCHIVED",
    replay: [
      "Direct route → GPR hazard detected → reroute via W-2 (+6 km)",
      "Cargo followed the amended route; no custody gaps",
    ],
  },
  {
    id: "DEC-1031",
    date: "22 Aug 2026 · 10:15",
    title: "Approve rotation rest window for two ANT-08 members",
    domain: "Personnel",
    decision: "Grant a 48-hour rotation rest window; ridge transect coverage reassigned to remaining crew.",
    context: {
      weather: "Maitri ridge nominal",
      assets: "SNOWCAT-07 available for shuttle",
      trigger: "Biometric fatigue flags on two members",
    },
    approvals: [
      { name: "Dr. Priya Nair", role: "ANT-08 lead", action: "Requested window" },
      { name: "Medical officer", role: "Maitri", action: "Cleared rest protocol" },
    ],
    versions: [
      { v: "v1.0", who: "Dr. Priya Nair", change: "Request filed", time: "22 Aug · 09:40" },
      { v: "v1.1", who: "Medical officer", change: "Approved", time: "22 Aug · 10:15" },
    ],
    retention: "ARCHIVED",
    replay: ["Fatigue flags → 48 h rest approved → transect plan adjusted"],
  },
];

/* ---------------- Next Feasible Opportunity (spec feature B) --------- */

export interface OpportunityOption {
  id: string;
  label: string;
  detail: string;
  cost: string;
  impact: string;
  eta: string;
  recommended?: boolean;
}

export const CG131_OPPORTUNITY = {
  cargoId: "CG-131",
  problem:
    "CG-131 has been held at Cape Town port for 36 hours. It carries the spare parts that ATV-021\u2019s overdue repair needs.",
  options: [
    {
      id: "vessel",
      label: "Wait — next ship sailing",
      detail: "Ship Ocean Quest leaves Cape Town 22 Sep · reaches Maitri ~04 Oct",
      cost: "+$5k storage at port",
      impact: "ATV-021\u2019s repair waits ~22 days; the spare-parts buffer holds until 26 Sep",
      eta: "Maitri ~04 Oct",
    },
    {
      id: "air",
      label: "Fly it in — charter a plane",
      detail: "Charter flight from Cape Town 15 Sep · transfer at the ice edge 16 Sep",
      cost: "+$50k plane charter",
      impact: "ATV-021\u2019s repair can start in ~4 days; keeps the spare-parts buffer safe",
      eta: "Maitri 16 Sep",
      recommended: true,
    },
  ] as OpportunityOption[],
  tradeOff:
    "Flying is 10× the cost but lands 18 days sooner and protects the spare-parts buffer. Whichever you pick is recorded as a decision for the team\u2019s memory.",
  rule: "The rule behind this: critical spare parts should reach the station within 14 days of an equipment being flagged.",
};

/* ---------------- Payload limit checker (Cargo) ---------------------- */

export const PAYLOAD_LIMIT_KG = 1800;

export function weightKgOf(weight: string): number {
  const n = parseInt(weight.replace(/[^0-9]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/* ---------------- Custody chain per consignment ---------------------- */

export interface CustodyStep {
  place: string;
  time?: string;
  done: boolean;
  current?: boolean;
  keeper?: string;
}

export const CARGO_CUSTODY: Record<string, CustodyStep[]> = {
  "CG-104": [
    { place: "Goa · ICRB", time: "10 Sep", done: true, keeper: "NCPOR stores" },
    { place: "Cape Town Port", time: "11 Sep · 08:40", done: true, keeper: "Port agent" },
    { place: "Vessel · Ocean Quest", time: "Since 11 Sep · 21:15", done: true, current: true, keeper: "Vessel master" },
    { place: "Maitri Station", done: false, keeper: "Awaiting ice-edge transfer" },
  ],
  "CG-118": [
    { place: "Goa · ICRB", time: "12 Sep", done: true, keeper: "NCPOR stores" },
    { place: "Cape Town Port", time: "Loading now", done: false, current: true, keeper: "Port agent" },
    { place: "Vessel · cargo hold 2", done: false, keeper: "— " },
    { place: "Bharati Station", done: false, keeper: "Harbor ops 18 Sep" },
  ],
  "CG-127": [
    { place: "Maitri Station", time: "09 Sep · 09:10", done: true, keeper: "NCPOR stores" },
    { place: "Traverse · SNOWCAT-07", time: "10 Sep · 07:45", done: true, keeper: "Convoy lead" },
    { place: "Zone B camp", time: "12 Sep · 11:20 · signed", done: true, keeper: "ANT-09 field lead" },
  ],
  "CG-131": [
    { place: "Goa · ICRB", time: "08 Sep", done: true, keeper: "NCPOR stores" },
    { place: "Cape Town Port", time: "Customs hold · 36 h", done: false, current: true, keeper: "Customs" },
    { place: "Vessel · Ocean Quest", done: false, keeper: "Awaiting release" },
    { place: "Maitri Station", done: false, keeper: "— " },
  ],
};

/* ---------------- Personnel location age ---------------------------- */

export const LOCATION_AGE_H: Record<string, number> = {
  "unit-09": 4.6,
  "unit-07": 0.4,
  "unit-08": 0.2,
  "unit-10": 0.3,
};

export function locationAgeTone(h: number): "ok" | "warn" | "crit" {
  if (h > 8) return "crit";
  if (h > 4) return "warn";
  return "ok";
}

/* STEP 5.1 — stamp each unit with its two separate timestamps, anchored
   to the scenario clock, and derive the two independent states.
   unit-09 demonstrates the audit's point: position STALE/LOST while the
   check-in is merely OVERDUE — the two are different signals. */
function parseCheckInMinutes(text: string): number {
  const m = text.match(/([\d.]+)\s*min/i);
  if (m) return parseFloat(m[1]);
  const h = text.match(/([\d.]+)\s*h/i);
  if (h) return parseFloat(h[1]) * 60;
  return 0;
}

for (const unit of PERSONNEL_UNITS) {
  const posH = LOCATION_AGE_H[unit.id] ?? 1;
  const checkMin = parseCheckInMinutes(unit.lastCheckIn);
  unit.lastPositionReceivedAt = scenarioIsoMinusMinutes(Math.round(posH * 60));
  unit.lastCommunicationAt = scenarioIsoMinusMinutes(Math.round(checkMin));
  unit.positionState = positionStateOf(posH);
  unit.checkInState = checkInStateOf(checkMin);
}

/* ---------------- Asset readiness meter (4 steps) -------------------- */

export interface ReadinessStep {
  key: string;
  label: string;
  ok: boolean;
  note: string;
}

export function assetReadiness(a: Asset): ReadinessStep[] {
  const sp = (a.spareParts ?? "").toLowerCase();
  const spareBlocked = sp.includes("delayed") || sp.includes("cg-131");
  return [
    { key: "loc", label: "Where it is", ok: true, note: a.location },
    {
      key: "insp",
      label: "Inspected",
      ok: !["ATV-021", "CONT-442"].includes(a.id),
      note: a.lastInspection ?? a.lastMaintenance,
    },
    { key: "spare", label: "Spares", ok: !spareBlocked, note: a.spareParts ?? "No critical shortages" },
    {
      key: "crew",
      label: "Crew",
      ok: a.status !== "CRITICAL",
      note: a.status === "CRITICAL" ? "Suspended — resolve seal issue first" : a.expedition,
    },
  ];
}

export function assetReadinessPct(a: Asset): number {
  return Math.round((assetReadiness(a).filter((s) => s.ok).length / 4) * 100);
}

/* ---------------- Incident phases (6-step spec timeline) ------------- */

export const INCIDENT_PHASES = [
  { key: "detection", label: "Spotted", detail: "The alarm beacon was matched with team data; everyone is accounted for" },
  { key: "localization", label: "Located", detail: "The closest rescue vehicle was found and its route was checked" },
  { key: "acknowledgment", label: "Confirmed", detail: "Help and equipment verified; a response plan is ready" },
  { key: "tasking", label: "Help sent", detail: "A person approved the dispatch; SV-04 is on its way" },
  { key: "coordination", label: "On scene", detail: "Convoy moving; zone movement frozen; team advised" },
  { key: "audit", label: "Review", detail: "Incident closed and the lessons archived" },
] as const;

export function incidentPhaseIndex(status: Incident["status"], halted: boolean): number {
  switch (status) {
    case "RESOLVED":
      return 5;
    case "RESPONDING":
      return 4;
    case "DISPATCHED":
      return 4;
    case "APPROVED":
      return 3;
    case "ASSESSED":
      return halted ? 2 : 1;
    default:
      return 0;
  }
}

/* ---------------- What-If rehearsal (spec feature: Failure Rehearsal) */

export interface WhatIfResult {
  incidentId: string;
  crisis: string;
  nearestAsset: { id: string; detail: string };
  medics: string;
  weather: string;
  originalResponse: string;
  projectedResponse: string;
  delta: string;
  verdict: string;
}

const WHATIF_BY_ID: Record<string, Omit<WhatIfResult, "incidentId" | "crisis">> = {
  "INC-1121": {
    nearestAsset: { id: "GEN-044", detail: "Ocean Quest · health 88% · load-bank tested 02 Sep" },
    medics: "2 medics on shift · Maitri clinic",
    weather: "-24°C · wind 14 kt · clear",
    originalResponse: "01h 10m (auto-correction by power controller)",
    projectedResponse: "00h 55m — controller firmware now auto-isolates phase imbalance in one step",
    delta: "-15 min vs original",
    verdict: "Today's fleet handles it without human intervention; advisory only.",
  },
  "INC-1114": {
    nearestAsset: { id: "DRONE-104", detail: "Maitri · battery 82% · relay-link firmware updated 12 Aug" },
    medics: "Not required — unmanned recovery",
    weather: "Ice-edge corridor · sea state 3 · visibility 12 km",
    originalResponse: "02h 05m (manual recovery during squall)",
    projectedResponse: "01h 20m — tighter link-loss alerting now pages the operator in 40 s",
    delta: "-45 min vs original",
    verdict: "Faster detection plus a ready relay UAV shortens recovery by a third.",
  },
  "INC-1102": {
    nearestAsset: { id: "SNOWCAT-07", detail: "Maitri · operational · tie-down kit aboard" },
    medics: "2 medics on shift · trauma kit sealed",
    weather: "Zone B · -29°C · 24 kt crosswind (marginal)",
    originalResponse: "01h 25m (route halted, cargo re-secured)",
    projectedResponse: "01h 05m — new tie-down checklist cuts re-securing time",
    delta: "-20 min vs original",
    verdict: "Checklist change from the original post-mortem is already in force.",
  },
  "INC-1096": {
    nearestAsset: { id: "RADAR-009", detail: "Bharati · attention · +2 heater elements in spares" },
    medics: "Not required",
    weather: "Bharati storm front · 38 kt gusting",
    originalResponse: "03h 40m (heater element replaced during storm)",
    projectedResponse: "02h 30m — spares now pre-stocked at Bharati post-INC-1096",
    delta: "-70 min vs original",
    verdict: "The stock decision recorded after this incident is what makes today faster.",
  },
};

export function whatIfFor(opId: string, crisis: string): WhatIfResult {
  const base = WHATIF_BY_ID[opId] ?? {
    nearestAsset: { id: "SV-04", detail: "Maitri QRF pad · fuel 90% · winch verified" },
    medics: "2 medics on shift",
    weather: "Current met telemetry",
    originalResponse: "Historic response time",
    projectedResponse: "Projected with today's posture",
    delta: "Improved",
    verdict: "Simulated rehearsal using current assets and personnel.",
  };
  return { incidentId: opId, crisis, ...base };
}

/* ---------------- Handover packet (spec: Export for Partner) --------- */

export function buildHandoverPacket(args: {
  incident: Incident;
  step: number;
  routeValidated: boolean;
  halted: boolean;
  status: Incident["status"];
  approval?: string;
}): string {
  const people = EXPEDITION_CREW["ant-09"].map((p) => ({
    name: p.name,
    role: p.role,
    location: "Research Zone B · sheltered at camp cache",
    status: "ACCOUNTED FOR",
  }));
  const assets = ASSETS.filter((a) => ["SV-04", "ATV-021", "DRONE-104"].includes(a.id)).map((a) => ({
    id: a.id,
    type: a.type,
    status: a.statusLabel,
    location: a.location,
    available: a.status === "STANDBY" || a.status === "OPERATIONAL",
  }));
  const tasks = WHITEOUT_STEPS.map((s, i) => ({
    index: i + 1,
    task: s.label,
    detail: s.detail,
    done: i <= args.step,
  }));
  return JSON.stringify(
    {
      packetType: "INCIDENT_HANDOVER",
      schema: "POLAR-X/1.0",
      generatedFor: "Partner agency · JSON payload sized for satellite transmission",
      syncPriority: "Incident > Personnel > Cargo > Inventory > Planning",
      incident: {
        id: args.incident.id,
        title: args.incident.title,
        severity: args.incident.severity,
        location: args.incident.location,
        detected: args.incident.time + " UTC",
        status: args.status,
        personnelAtRisk: args.incident.personnel,
        routeValidated: args.routeValidated,
        movementHalted: args.halted,
      },
      peopleInvolved: people,
      assetsInvolved: assets,
      tasks,
      approval: args.approval ?? "Pending human sign-off — POLAR-X never auto-executes",
      provenance: "SIMULATED DATA — POLAR-X prototype drill record",
    },
    null,
    2
  );
}

/* ================================================================== */
/* FEATURE 6 — Rules Engine (spec: "Why did this alert trigger?")      */
/* Evidence: report §11 "rules-first maintenance analytics".           */
/* Every alert/status in the app traces back to one of these rules;    */
/* thresholds are human-configurable and every edit is versioned +     */
/* logged to the Black Box.                                            */
/* ================================================================== */

export interface RuleVersion {
  v: string;
  change: string;
  by: string;
  when: string;
}

export interface OpRule extends Rule {
  example: string;
  /** hard ceiling for the admin editor */
  thresholdMax: number;
  evidence: string;
  domain: "Personnel" | "Cargo" | "Inventory" | "All domains";
  usedBy: string[];
  versions: RuleVersion[];
}

export const RULES: OpRule[] = [
  {
    id: "R-01",
    name: "Missed check-in",
    description: "Alerts when a team out on the ice misses its regular radio check-in.",
    condition: "no check-in from a field party",
    example: "ANT-09 last checked in 22 min ago → alert fires, People bar turns red (plan says every 15 min)",
    action: "Alert + escalate to Station Leader",
    threshold: { value: 15, unit: "minutes" },
    thresholdMax: 240,
    evidence: "Report §4 & §7.1 — ANT-09 check-in cadence is the primary safety signal",
    domain: "Personnel",
    usedBy: ["People · missed check-in bar", "People · safe / needs-check filters"],
    enabled: true,
    triggeredCount: 3,
    versions: [
      { v: "v3.1", change: "Limit 4h → 15 min to match the 15-minute check-in protocol used on the People screen", by: "Cmdr. V. Vance", when: "02 Sep 2026" },
      { v: "v3.0", change: "Limit 6h → 4h after the 2016 crevasse review (help arrives in 3h, so 6h was too slow)", by: "Cmdr. V. Vance", when: "12 Jan 2026" },
      { v: "v2.0", change: "Threshold 8h → 6h; add escalation to Station Leader", by: "S. Iyer", when: "03 Mar 2024" },
      { v: "v1.0", change: "Initial rule — 8h threshold, log-only", by: "NCPOR ops", when: "15 Nov 2022" },
    ],
  },
  {
    id: "R-02",
    name: "Spare stock below reorder point",
    description: "Alerts when a critical spare or supply drops under its safe stock share.",
    condition: "stock of a critical spare or supply",
    example: "Oxygen cylinders at 9% → REORDER badge on the supply line",
    action: "Red badge + Recommend resupply protocol",
    threshold: { value: 10, unit: "percent" },
    thresholdMax: 50,
    evidence: "Report §4 — 'a stock count alone does not show whether a system can return to service'",
    domain: "Inventory",
    usedBy: ["Supplies · reorder badges", "Supplies · resupply plan"],
    enabled: true,
    triggeredCount: 5,
    versions: [
      { v: "v2.1", change: "Added per-site thresholds for Zone B caches", by: "Logistics bot config", when: "21 Jun 2026" },
      { v: "v2.0", change: "Threshold 15% → 10% to cut false reorder alerts", by: "S. Iyer", when: "02 Feb 2025" },
      { v: "v1.0", change: "Initial rule", by: "NCPOR ops", when: "15 Nov 2022" },
    ],
  },
  {
    id: "R-03",
    name: "Inspection overdue blocks readiness",
    description: "Alerts when a piece of equipment has gone too long without a valid inspection.",
    condition: "no valid inspection on record",
    example: "ATV-021 inspection overdue → readiness meter fails at step 2",
    action: "Block asset readiness (asset cannot be marked ready)",
    threshold: { value: 7, unit: "days" },
    thresholdMax: 30,
    evidence: "Report §4 — readiness ≠ stock; an uninspected vehicle is not a ready vehicle",
    domain: "Inventory",
    usedBy: ["Equipment · ready-to-use check", "Expedition Plans · who can go"],
    enabled: true,
    triggeredCount: 2,
    versions: [
      { v: "v1.2", change: "Clarify: blocks readiness, does not ground vehicle automatically (human decides)", by: "Cmdr. V. Vance", when: "18 May 2026" },
      { v: "v1.0", change: "Initial rule — 7 day inspection window", by: "NCPOR ops", when: "15 Nov 2022" },
    ],
  },
  {
    id: "R-04",
    name: "Too much weight on a flight",
    description: "Alerts when a flight is loaded past its safe weight limit.",
    condition: "the total weight loaded on one flight",
    example: "1,930 kg loaded on Leg 3 → progress bar enters red zone, cargo rejected",
    action: "Reject cargo for the flight leg",
    threshold: { value: 1800, unit: "kg" },
    thresholdMax: 2400,
    evidence: "Report §3.3 — 1,500–1,800 kg payload ceiling and 90×72×45 cm package constraint",
    domain: "Cargo",
    usedBy: ["Cargo · weight check", "Cargo · shipment checks"],
    enabled: true,
    triggeredCount: 1,
    versions: [
      { v: "v1.1", change: "Add red zone at 80% of limit (visual early warning)", by: "S. Iyer", when: "09 Jul 2026" },
      { v: "v1.0", change: "Initial rule — 1,800 kg hard limit per DHC-6 Twin Otter spec", by: "NCPOR ops", when: "15 Nov 2022" },
    ],
  },
  {
    id: "R-05",
    name: "Stale data",
    description: "Alerts when a record has not been refreshed for too long to trust.",
    condition: "no data refresh",
    example: "Weather reading 9h old → data-age badge turns red, record marked stale",
    action: "Mark record stale + flag in Needs Attention",
    threshold: { value: 8, unit: "hours" },
    thresholdMax: 24,
    evidence: "Report §7 — decisions made on stale telemetry were a root cause in two review findings",
    domain: "All domains",
    usedBy: ["Every \"Updated\" badge in the app", "Mission Overview · Needs attention"],
    enabled: true,
    triggeredCount: 7,
    versions: [
      { v: "v2.0", change: "Two-tier: >4h yellow, >8h red (was single 6h)", by: "Cmdr. V. Vance", when: "14 Feb 2026" },
      { v: "v1.0", change: "Initial rule", by: "NCPOR ops", when: "15 Nov 2022" },
    ],
  },
  {
    id: "R-06",
    name: "Handover left open",
    description: "Alerts when a package sits unsigned between two handlers for too long.",
    condition: "an unsigned handover",
    example: "Cape Town port handover open 7h → 'Custody gap detected' alert with previous handler + phone",
    action: "Red custody alert with previous handler contact",
    threshold: { value: 6, unit: "hours" },
    thresholdMax: 24,
    evidence: "Report §8 — signed digital custody trail Goa → Cape Town → Vessel → Station",
    domain: "Cargo",
    usedBy: ["Cargo · handover trail", "Cargo · handover report download"],
    enabled: true,
    triggeredCount: 1,
    versions: [
      { v: "v1.0", change: "Initial rule", by: "Logistics bot config", when: "10 Apr 2024" },
    ],
  },
  {
    id: "R-07",
    name: "Location age",
    description: "Alerts when a person's or vehicle's last known position gets old.",
    condition: "no fresh position update",
    example: "ANT-09 position 4h 36m old → yellow LOCATION AGE badge on personnel card",
    action: "Location-age badge turns yellow, then red",
    threshold: { value: 4, unit: "hours" },
    thresholdMax: 12,
    evidence: "Report §7.1 — last-confirmed-location is the personnel safety backbone",
    domain: "Personnel",
    usedBy: ["People · position-age badges", "Mission Overview · live map"],
    enabled: true,
    triggeredCount: 4,
    versions: [
      { v: "v1.0", change: "Initial rule — 4h/8h two-tier", by: "NCPOR ops", when: "15 Nov 2022" },
    ],
  },
  {
    /* STEP 11 — every alert must cite a real rule; the whiteout alert
       previously had no rule to reference. */
    id: "R-08",
    name: "Weather visibility floor",
    description: "Alerts when the forecast chance of usable visibility in an operating zone drops too low.",
    condition: "clear-line-of-sight probability in the operating zone",
    example: "AWS-12 + model agree whiteout likelihood 64% near Zone B → movement hold, weather alert raised",
    action: "Weather alert + movement hold recommendation",
    threshold: { value: 35, unit: "percent" },
    thresholdMax: 60,
    evidence: "Report §5 — whiteout probability drives the movement-hold recommendation",
    domain: "All domains",
    usedBy: ["Top-bar alert bell", "Mission Overview · weather attention card"],
    enabled: true,
    triggeredCount: 2,
    versions: [
      { v: "v1.0", change: "Initial rule — mirrors the Zone B hold protocol", by: "Cmdr. V. Vance", when: "05 Aug 2026" },
    ],
  },
];

/* ================================================================== */
/* FEATURE 7 — Cascade Simulator (spec: "What if X fails?")            */
/* Evidence: report §6 — Halley VI: coolant leak → generators overheat */
/* → 19 hours no power → 13 people at risk → science ops halted.       */
/* ================================================================== */

export interface CascadeNode {
  label: string;
  state: "STOPS" | "DOWN" | "HALTED" | "AT RISK";
  impact: string;
  eta: string;
}

export interface CascadeMitigation {
  label: string;
  ok: boolean | null; // true available · false missing · null partial
  detail: string;
}

export interface CascadeScenario {
  id: string;
  name: string;
  root: string;
  rootNote: string;
  nodes: CascadeNode[];
  mitigations: CascadeMitigation[];
  alternatives: { title: string; detail: string }[];
  evidence: string;
}

export const CASCADE_SCENARIOS: CascadeScenario[] = [
  {
    id: "gen-2",
    name: "Generator #2 (Maitri main)",
    root: "Generator #2 FAILS",
    rootNote: "Coolant leak → overheating → automatic shutdown of the base-load unit.",
    nodes: [
      { label: "Water Treatment", state: "STOPS", impact: "25 people without running water in 18 hours", eta: "T + 2h" },
      { label: "Heating System", state: "DOWN", impact: "-32°C risk to 25 people in living quarters", eta: "T + 6h" },
      { label: "Science Ops", state: "HALTED", impact: "Ice-core cold chain lost; lab programme paused", eta: "T + 9h" },
    ],
    mitigations: [
      { label: "Spare generator", ok: false, detail: "NOT AVAILABLE — nearest spare is at Cape Town, 10–12 days out" },
      { label: "Battery backup", ok: true, detail: "4 hours of critical load (comms + medical only)" },
      { label: "Load-shedding plan", ok: null, detail: "Partial — can hold heating OR water treatment, not both" },
    ],
    alternatives: [
      { title: "If Generator #1 failed instead", detail: "Impact is LOWER — the #2 unit is serviceable and can carry base load within 40 minutes of changeover." },
      { title: "If it fails during the Oct service window", detail: "Wear would have been caught at the scheduled inspection — scenario probability drops sharply." },
      { title: "If it fails while the resupply vessel is in port", detail: "Heavy spares could be lightered ashore in 3 days instead of 10–12 — mitigation turns green." },
    ],
    evidence: "Halley VI 2014 — coolant leak → 19 h power loss → 13 people at risk → science halted.",
  },
  {
    id: "water",
    name: "Water Treatment plant",
    root: "Water Treatment FAILS",
    rootNote: "Brine line freeze rupture; plant auto-isolates to protect the heat loop.",
    nodes: [
      { label: "Potable Water", state: "AT RISK", impact: "72-hour reserve before rationing at 3 L/person/day", eta: "T + 0h" },
      { label: "Kitchen & Mess", state: "STOPS", impact: "Hot meals suspended; field parties switch to rations", eta: "T + 4h" },
      { label: "Diesel Boilers", state: "AT RISK", impact: "Consumption +8% as they run hotter to compensate", eta: "T + 12h" },
    ],
    mitigations: [
      { label: "Reserve tanks", ok: true, detail: "72 hours at full station complement" },
      { label: "Spare pump module", ok: true, detail: "In-store at Maitri — 6-hour changeover, two technicians" },
      { label: "Snow-melt backup", ok: null, detail: "Manual melt plan covers drinking water only, 40% of demand" },
    ],
    alternatives: [
      { title: "If the failure hits mid-winter", detail: "Repair window shrinks to daylight hours — changeover doubles to 12 hours; reserve covers it but with no slack." },
      { title: "If the brine line was trace-heated", detail: "Proposed upgrade removes the most common failure mode — currently unfunded (PROPOSED INTEGRATION)." },
    ],
    evidence: "Station logistics review — water systems share heat trace with the power loop (single point of failure).",
  },
  {
    id: "comms",
    name: "Satellite internet (station)",
    root: "SATCOM UPLINK LOST",
    rootNote: "Antenna de-ice failure during storm — uplink down beyond the 4-hour backup window.",
    nodes: [
      { label: "Field Parties", state: "AT RISK", impact: "Check-ins blocked — ANT-09 & ANT-10 fall under missed-check-in rule R-01", eta: "T + 4h" },
      { label: "Medical Evac", state: "DOWN", impact: "No telemedicine; evac coordination falls to COSPAS-SARSAT beacons", eta: "T + 4h" },
      { label: "Cloud Sync", state: "HALTED", impact: "Black Box uplink pauses — local hash chain keeps recording", eta: "T + 0h" },
    ],
    mitigations: [
      { label: "Iridium handhelds", ok: true, detail: "6 units — voice + limited text for priority traffic" },
      { label: "Emergency beacons", ok: true, detail: "COSPAS-SARSAT on every field party — receive-only via satellite pass" },
      { label: "HF backup radio", ok: null, detail: "Usable in the current ionospheric window, ~40% of traffic capacity" },
    ],
    alternatives: [
      { title: "If DRONE-107 is serviceable", detail: "It can ferry a memory card between Maitri and Zone B in 50 minutes — paper-bridge for the highest priority traffic." },
      { title: "If the storm was forecast", detail: "Pre-storm protocol moves check-in cadence to hourly and tops handheld batteries — impact mostly avoided." },
    ],
    evidence: "WHITEOUT drill 2026 — comms loss was the first cascade step of the Zone B incident.",
  },
  {
    id: "heating",
    name: "Heating system (main hab)",
    root: "HEATING SYSTEM DOWN",
    rootNote: "Glycol loop pump seizure; hab temperature falling 1.8°C per hour.",
    nodes: [
      { label: "Living Quarters", state: "AT RISK", impact: "25 people relocate to the summer module within 8 hours", eta: "T + 8h" },
      { label: "Cold Labs", state: "AT RISK", impact: "Sample cold-chain holds 30 h on passive freezers", eta: "T + 12h" },
      { label: "Vehicle Pre-heat", state: "DOWN", impact: "SV-04 & ATV-021 cold-soak — 90 min extra start sequence", eta: "T + 6h" },
    ],
    mitigations: [
      { label: "Spare circulation pump", ok: true, detail: "In-store — 4-hour swap, requires generator #2 at full load" },
      { label: "Summer module capacity", ok: true, detail: "Bunks for 28 — absorbs the relocation" },
      { label: "Diesel fired heaters", ok: null, detail: "2 portable units — keep pipes frost-free, not full heating" },
    ],
    alternatives: [
      { title: "If the pump fails during a storm", detail: "External repair becomes a 2-person rope-aid job in whiteout — plan slips to the next weather window." },
      { title: "If occupied at half complement", detail: "Summer module absorbs everyone without rationing changes — impact drops one tier." },
    ],
    evidence: "Report §6 — cold-chain and habitation losses compound faster than any other utility failure.",
  },
];

/* ================================================================== */
/* FEATURE 8 — Black Box Recorder (spec: "What happened and what did   */
/* we learn?") Evidence: report §6 — three real incidents to learn     */
/* from (2013 ice entrapment · 2014 Halley VI power · 2016 crevasse).  */
/* ================================================================== */

export const BLACKBOX_STREAMS: { label: string; cadence: string; today: number }[] = [
  { label: "Positions", cadence: "every 10 min", today: 144 },
  { label: "Comms", cadence: "per message", today: 37 },
  { label: "Decisions", cadence: "per sign-off", today: 5 },
  { label: "Alerts", cadence: "per trigger", today: 12 },
  { label: "Approvals", cadence: "per approval", today: 3 },
  { label: "Weather", cadence: "every 30 min", today: 48 },
];

export const BLACKBOX_CHAIN: { seq: number; type: string; time: string; summary: string; hash: string; prev: string }[] = [
  { seq: 1281, type: "POSITION", time: "09:40", summary: "ANT-09 grid fix 70.123°S · GPS ±5m", hash: "7f3a9c…e21b", prev: "— genesis —" },
  { seq: 1282, type: "WEATHER", time: "10:00", summary: "Maitri -32°C clear · Bharati -28°C windy", hash: "a4d1f0…93c7", prev: "7f3a9c…e21b" },
  { seq: 1283, type: "ALERT", time: "10:22", summary: "R-04 payload 1,930 kg > 1,800 kg (CG-131 leg 3)", hash: "c09b52…4f8a", prev: "a4d1f0…93c7" },
  { seq: 1284, type: "DECISION", time: "10:47", summary: "Reroute 2 pallets to next flight — human sign-off", hash: "e5c77a…d102", prev: "c09b52…4f8a" },
  { seq: 1285, type: "APPROVAL", time: "10:52", summary: "Cmdr. V. Vance approved reroute (2-key gate)", hash: "91b3e4…6a55", prev: "e5c77a…d102" },
  { seq: 1286, type: "POSITION", time: "11:10", summary: "SV-04 standby at Maitri QRF pad", hash: "3d84f6…b7e9", prev: "91b3e4…6a55" },
];

export interface ReplayTick {
  t: string;
  known: string;
  decided: string;
  outcome: string;
}

export interface ReplayIncident {
  id: string;
  year: string;
  title: string;
  duration: string;
  ticks: ReplayTick[];
  lesson: string;
}

export const BLACKBOX_REPLAY: ReplayIncident[] = [
  {
    id: "bb-2013",
    year: "2013",
    title: "Ice entrapment — vessel stuck 7 days",
    duration: "7 days",
    lesson: "Ice forecasts were 12 h old when the route call was made — Rule R-05 (stale data) exists because of this incident.",
    ticks: [
      { t: "Day 0 · 06:00", known: "Ice chart from the previous morning (12 h old); route corridor still marked OPEN.", decided: "Vessel committed to the shortcut corridor on the stale chart.", outcome: "Vessel entered fast ice by evening." },
      { t: "Day 1 · 14:00", known: "Radar shows pressure ridge forming across the corridor astern.", decided: "Hold position; no reverse route available.", outcome: "Vessel beset — drift begins with the pack." },
      { t: "Day 2 · 09:00", known: "Station fuel margin fine, but fresh food down to 9 days at current complement.", decided: "Rationing level 2 declared by station leader.", outcome: "Consumption stretched to 16 days." },
      { t: "Day 4 · 11:00", known: "Icebreaker 1,400 km away — 5 days best case through the pack.", decided: "Request icebreaker tasking; begin science work with ship's labs to preserve the programme.", outcome: "Science output partially preserved." },
      { t: "Day 7 · 16:00", known: "Wind shift + 2 days of southerly opened a lead along the shelf break.", decided: "Escort through the lead under own power.", outcome: "Vessel free after 7 days; no injuries; cargo schedule slipped 9 days." },
    ],
  },
  {
    id: "bb-2014",
    year: "2014",
    title: "Halley VI power loss — 19 hours",
    duration: "19 hours",
    lesson: "The cascade was a coolant leak → generator overheat → station power — the exact chain the Cascade Simulator replays.",
    ticks: [
      { t: "T + 0h", known: "Coolant alarm in the generator module; leak rate rising.", decided: "Unit taken offline before catastrophic damage (correct call).", outcome: "Base load transferred to remaining unit." },
      { t: "T + 2h", known: "Remaining generator tripping on overload; heating load highest of the season.", decided: "Load shed to critical circuits: heat, water, comms.", outcome: "Science ops halted; habitation held." },
      { t: "T + 6h", known: "Spare generator module unavailable on-site — nearest spare 10–12 days away (same gap as today's simulator).", decided: "Battery backup reserved for comms + medical only.", outcome: "4-hour battery window managed strictly." },
      { t: "T + 11h", known: "Water treatment stopped — 25 people on reserve tanks.", decided: "Rationing started; snow-melt crew formed.", outcome: "Drinking water secured." },
      { t: "T + 19h", known: "Temporary coolant patch held; unit restarted at partial load.", decided: "Staged re-power over 3 hours to avoid repeat trip.", outcome: "Power restored; 13 people had been at risk; full review created the cascade-planning requirement." },
    ],
  },
  {
    id: "bb-2016",
    year: "2016",
    title: "Crevasse fall — 3 hours to arrival",
    duration: "3 hours",
    lesson: "Response took 3 hours because tasking had no single timeline — the 6-phase incident timeline (Detection → … → Audit) was built from this review.",
    ticks: [
      { t: "T + 0min", known: "Snowmobile broke through a snow bridge; one person down a 12 m crevasse, in contact on radio.", decided: "First aiders secure scene; rope anchor started.", outcome: "Casualty stabilised and warm." },
      { t: "T + 35min", known: "Party location known only from memory of the last GPS call 40 min earlier.", decided: "Position relayed via sat phone to station.", outcome: "Search box narrowed to 300 m." },
      { t: "T + 1h 20m", known: "Rescue sled team assembling; weather window open but narrowing.", decided: "Task team with explicit roles: anchor, haul, medic.", outcome: "Team departed with winch gear." },
      { t: "T + 2h 10m", known: "Casualty showing early hypothermia despite survival bag.", decided: "Haul commenced with station medic on open channel.", outcome: "Casualty on surface." },
      { t: "T + 3h 00m", known: "Casualty back at station; frostbite to two fingers.", decided: "Medevac decision logged with full approval chain.", outcome: "Full recovery; review created phase-based incident timelines." },
    ],
  },
];

export interface DecisionWhatIf {
  id: string;
  title: string;
  actual: string;
  alternative: string;
  projection: string[];
  verdict: "BETTER" | "WORSE" | "SIMILAR";
  verdictNote: string;
}

export const DECISION_WHATIFS: DecisionWhatIf[] = [
  {
    id: "wi-1",
    title: "What if CG-131 spare parts had flown instead of sailing?",
    actual: "Bound to Ocean Quest voyage 26-09 (sea freight, 10–12 days, $0 marginal cost)",
    alternative: "Air freight the 6 track-link kits + coolant lines from Cape Town",
    projection: [
      "Arrival at Maitri: 6 days earlier (2 days vs 8 days)",
      "Marginal cost: +$85k charter share — not budgeted",
      "Cold-chain risk: coolant lines fine, but 2 electronic kits exceed cabin temp limits",
      "ATV-021 would still have needed the inspection stop (spares ≠ inspection)",
    ],
    verdict: "WORSE",
    verdictNote: "Sea freight met the need date once the inspection advisory kept ATV-021 near camp — the air premium bought speed that was not needed.",
  },
  {
    id: "wi-2",
    title: "What if ATV-021 had been recalled mid-traverse instead of the advisory?",
    actual: "Restricted-movement advisory + inspect at camp (DEC-1049)",
    alternative: "Immediate recall to Maitri for full workshop inspection",
    projection: [
      "ANT-09 grid survey loses 3 field days and its only ATV",
      "Zone B oxygen resupply loses its prime mover for 2 days",
      "Risk score drops to LOW within 48 h — but traverse schedule slips 5 days",
      "Weather window for the SY-118/119 milestone likely missed",
    ],
    verdict: "SIMILAR",
    verdictNote: "Recall was safer on paper; the advisory achieved the same inspection outcome without breaking the survey — but only because the coolant trend stayed linear. Had it inflected, recall would have been BETTER.",
  },
  {
    id: "wi-3",
    title: "What if the WHITEOUT drill had waited for the weather window?",
    actual: "Immediate route validation + SV-04 dispatch on the validated corridor",
    alternative: "Hold dispatch until the 15:30–22:00 window stated in the forecast",
    projection: [
      "Hypothermia window for 3 crew: 07h 42m — dispatch at 15:30 leaves 2h 20m margin",
      "Any forecast slip converts margin negative with no daylight recovery",
      "COSPAS-SARSAT localization already fixed — waiting added no information",
    ],
    verdict: "WORSE",
    verdictNote: "The alternative consumed the entire hypothermia margin on a forecast that could slip. Immediate dispatch after validation was the correct human call.",
  },
];
