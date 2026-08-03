/**
 * Core Web Vitals telemetry — WO-051
 *
 * PII-free CWV reporting:
 *   - Sends to /api/vitals (Next.js route handler) via beacon/fetch.
 *   - Groups metrics by route prefix so dashboards can slice by page area.
 *   - Enforces CWV thresholds inline — marks "good", "needs-improvement", or "poor".
 *   - Batches up to 10 metrics before flushing to avoid thundering herd.
 *   - Never sends: user IDs, session tokens, contact info, or personal data.
 *
 * Usage: place <VitalsReporter /> in the root layout (client component).
 */

export type CwvMetricName = "FCP" | "LCP" | "CLS" | "FID" | "TTFB" | "INP";
export type CwvRating = "good" | "needs-improvement" | "poor";

export interface CwvMetric {
  name: CwvMetricName;
  value: number;
  delta: number;
  id: string;
  rating: CwvRating;
  routePrefix: string;
  appVersion: string;
}

// Core Web Vitals thresholds per Google Lighthouse 2024 guidance
const THRESHOLDS: Record<CwvMetricName, [number, number]> = {
  FCP:  [1800, 3000],
  LCP:  [2500, 4000],
  CLS:  [0.1,  0.25],
  FID:  [100,  300],
  TTFB: [800,  1800],
  INP:  [200,  500],
};

function rateMetric(name: CwvMetricName, value: number): CwvRating {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

function routePrefixFor(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  // Redact dynamic segments (UUIDs, IDs)
  const redacted = segments
    .slice(0, 2)
    .map((s) => (/^[0-9a-f-]{8,}$/i.test(s) ? "[id]" : s));
  return `/${redacted.join("/")}`;
}

const _queue: CwvMetric[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  if (_queue.length === 0) return;
  const payload = _queue.splice(0, _queue.length);
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/vitals/batch", body);
  } else {
    void fetch("/api/vitals/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }
}

/**
 * Report a single CWV metric.
 * Called by the `useReportWebVitals` Next.js hook in the root layout.
 */
export function reportWebVital(
  metric: { name: string; value: number; delta: number; id: string },
  pathname: string,
  appVersion = process.env["NEXT_PUBLIC_APP_VERSION"] ?? "unknown",
): void {
  const name = metric.name as CwvMetricName;
  if (!THRESHOLDS[name]) return; // Ignore unknown metric names

  const entry: CwvMetric = {
    name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    rating: rateMetric(name, metric.value),
    routePrefix: routePrefixFor(pathname),
    appVersion,
  };

  _queue.push(entry);

  // Flush immediately if queue is full
  if (_queue.length >= 10) {
    flush();
    return;
  }
  // Debounce flush: send within 5 s of first entry
  if (!_flushTimer) {
    _flushTimer = setTimeout(() => {
      _flushTimer = null;
      flush();
    }, 5000);
  }
}

/** Performance budget thresholds (for CI assertions) */
export const BUDGETS: Record<CwvMetricName, { good: number; poor: number }> = {
  FCP:  { good: THRESHOLDS.FCP[0],  poor: THRESHOLDS.FCP[1]  },
  LCP:  { good: THRESHOLDS.LCP[0],  poor: THRESHOLDS.LCP[1]  },
  CLS:  { good: THRESHOLDS.CLS[0],  poor: THRESHOLDS.CLS[1]  },
  FID:  { good: THRESHOLDS.FID[0],  poor: THRESHOLDS.FID[1]  },
  TTFB: { good: THRESHOLDS.TTFB[0], poor: THRESHOLDS.TTFB[1] },
  INP:  { good: THRESHOLDS.INP[0],  poor: THRESHOLDS.INP[1]  },
};

// Backward-compatible alias for legacy WebVitalsReporter component
export async function reportWebVitals(metric: { name: string; value: number; delta: number; id: string }): Promise<void> {
  if (typeof window === 'undefined') return;
  reportWebVital(metric, window.location.pathname);
}
