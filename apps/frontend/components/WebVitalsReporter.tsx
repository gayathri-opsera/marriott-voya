"use client";

import { useReportWebVitals } from "next/web-vitals";
import { reportWebVitals } from "../lib/vitals";

export function WebVitalsReporter(): null {
  useReportWebVitals((metric) => {
    void reportWebVitals({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
    });
  });
  return null;
}
