/**
 * Unit tests for Core Web Vitals telemetry — WO-051
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportWebVital, BUDGETS, type CwvMetricName } from "../../lib/vitals";

// Stub navigator.sendBeacon
const mockBeacon = vi.fn(() => true);

beforeEach(() => {
  vi.stubGlobal("navigator", { sendBeacon: mockBeacon });
  vi.useFakeTimers();
  mockBeacon.mockClear();
});

describe("BUDGETS", () => {
  it("defines thresholds for all 6 CWV metrics", () => {
    const expected: CwvMetricName[] = ["FCP", "LCP", "CLS", "FID", "TTFB", "INP"];
    expected.forEach((m) => {
      expect(BUDGETS[m]).toBeDefined();
      expect(typeof BUDGETS[m].good).toBe("number");
      expect(typeof BUDGETS[m].poor).toBe("number");
    });
  });

  it("LCP good threshold is 2500ms (Google 2024)", () => {
    expect(BUDGETS.LCP.good).toBe(2500);
  });

  it("CLS good threshold is 0.1", () => {
    expect(BUDGETS.CLS.good).toBe(0.1);
  });
});

describe("reportWebVital", () => {
  it("ignores unknown metric names", () => {
    reportWebVital(
      { name: "UNKNOWN_METRIC", value: 100, delta: 10, id: "test-id" },
      "/",
    );
    vi.runAllTimers();
    expect(mockBeacon).not.toHaveBeenCalled();
  });

  it("queues metrics and flushes after 5s debounce", () => {
    reportWebVital({ name: "LCP", value: 2000, delta: 2000, id: "lcp-1" }, "/");
    reportWebVital({ name: "FCP", value: 1500, delta: 1500, id: "fcp-1" }, "/");
    expect(mockBeacon).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    expect(mockBeacon).toHaveBeenCalledOnce();
  });

  it("flushes immediately when queue reaches 10 entries", () => {
    for (let i = 0; i < 10; i++) {
      reportWebVital({ name: "FCP", value: 1200, delta: 100, id: `fcp-${i}` }, "/");
    }
    expect(mockBeacon).toHaveBeenCalledOnce();
  });
});

describe("BUDGETS ratings (indirect via thresholds)", () => {
  it("LCP 2000ms is below good threshold of 2500ms", () => {
    expect(2000 <= BUDGETS.LCP.good).toBe(true);
  });

  it("CLS 0.15 is between good and poor thresholds", () => {
    expect(0.15 > BUDGETS.CLS.good).toBe(true);
    expect(0.15 < BUDGETS.CLS.poor).toBe(true);
  });
});
