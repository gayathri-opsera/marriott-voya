"use client";

/**
 * VitalsReporter — WO-051
 * Client component that hooks into Next.js useReportWebVitals to capture
 * Core Web Vitals and report them via lib/vitals.ts.
 * Add <VitalsReporter /> to the root layout once.
 */

import { useReportWebVitals } from "next/web-vitals";
import { usePathname } from "next/navigation";
import { reportWebVital } from "@/lib/vitals";

export function VitalsReporter(): null {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    reportWebVital(metric, pathname ?? "/");
  });

  return null;
}
