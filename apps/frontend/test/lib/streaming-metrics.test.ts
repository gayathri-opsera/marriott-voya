import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startStreamingSession,
  recordFirstToken,
  recordToken,
  recordToolCallEnd,
  completeStreamingSession,
  rateTtft,
  TTFT_BUDGETS,
} from "../../lib/streaming-metrics.js";

describe("streaming session lifecycle", () => {
  let sessionId: string;

  beforeEach(() => {
    sessionId = `test-session-${Date.now()}`;
  });

  it("records TTFT when first token is received", () => {
    startStreamingSession(sessionId);
    recordFirstToken(sessionId);
    const metrics = completeStreamingSession(sessionId);
    expect(metrics).not.toBeNull();
    expect(metrics!.ttftMs).toBeGreaterThanOrEqual(0);
  });

  it("records token count", () => {
    startStreamingSession(sessionId);
    recordFirstToken(sessionId);
    recordToken(sessionId, 5);
    recordToken(sessionId, 3);
    const metrics = completeStreamingSession(sessionId);
    expect(metrics!.tokenCount).toBe(8);
  });

  it("records tool calls", () => {
    startStreamingSession(sessionId);
    const start = Date.now() - 100;
    recordToolCallEnd(sessionId, start);
    recordToolCallEnd(sessionId, start);
    const metrics = completeStreamingSession(sessionId);
    expect(metrics!.toolCallCount).toBe(2);
    expect(metrics!.avgToolCallMs).toBeGreaterThan(0);
  });

  it("returns null for unknown session", () => {
    const metrics = completeStreamingSession("non-existent-session");
    expect(metrics).toBeNull();
  });

  it("does not double-apply firstTokenAt", () => {
    startStreamingSession(sessionId);
    recordFirstToken(sessionId);
    const t1 = Date.now();
    recordFirstToken(sessionId);
    const metrics = completeStreamingSession(sessionId);
    expect(metrics!.ttftMs).toBeLessThanOrEqual(t1 - Date.now() + 50);
  });
});

describe("rateTtft", () => {
  it("rates null as poor", () => {
    expect(rateTtft(null)).toBe("poor");
  });

  it("rates <= good threshold as good", () => {
    expect(rateTtft(TTFT_BUDGETS.good)).toBe("good");
    expect(rateTtft(100)).toBe("good");
  });

  it("rates <= acceptable threshold as acceptable", () => {
    expect(rateTtft(TTFT_BUDGETS.good + 1)).toBe("acceptable");
    expect(rateTtft(TTFT_BUDGETS.acceptable)).toBe("acceptable");
  });

  it("rates > acceptable as poor", () => {
    expect(rateTtft(TTFT_BUDGETS.poor)).toBe("poor");
    expect(rateTtft(5000)).toBe("poor");
  });
});
