"use client";

/**
 * STEP 13 — axe-core accessibility scanner (development only).
 * Dynamically imported so production builds carry zero cost. Violations
 * are reported in the browser console with a "axe:" prefix; import the
 * results in the devtools console via window.axe if needed.
 */
import { useEffect } from "react";

export function AxeScanner() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    let cancelled = false;
    (async () => {
      try {
        const [axeReact, React, ReactDOM] = await Promise.all([
          import("@axe-core/react"),
          import("react"),
          import("react-dom"),
        ]);
        if (cancelled) return;
        const mod = (axeReact as unknown as { default: (r: unknown, rd: unknown, ms: number) => void }).default;
        mod(React, ReactDOM, 1500);
        console.info("axe: accessibility scanner attached (dev only)");
      } catch {
        /* scanner is best-effort — never block the app */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
