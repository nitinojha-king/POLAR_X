/**
 * STEP 2.2 — simulation-aware verbs.
 * In simulation mode the app must never speak production language
 * ("CONNECTED", "DELIVERED", "TRANSMIT") — every operational verb gets
 * an honest simulated counterpart. Usage:
 *
 *   <button>{t("Simulate send", "Transmit")}</button>
 *   <span>{t("Simulated delivery", "Delivered")}</span>
 */
import { isSimulationActive } from "./clock";

export function t(simulated: string, live: string): string {
  return isSimulationActive() ? simulated : live;
}
