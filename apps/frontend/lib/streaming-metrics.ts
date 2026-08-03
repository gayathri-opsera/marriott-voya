/**
 * AI Streaming Responsiveness Metrics — WOREF-048
 *
 * Captures Time-to-First-Token (TTFT), streaming throughput, and total
 * response time for the Concierge AI chat. Reports to /api/vitals/batch
 * using the same PII-free pipeline as Core Web Vitals.
 *
 * Key metrics:
 * - TTFT (ms): Time from request send to first token received
 * - STREAMING_THROUGHPUT (tokens/sec): Tokens per second during stream
 * - STREAMING_TOTAL_MS: Total stream duration from first to last token
 * - TOOL_CALL_ROUND_TRIP_MS: Time for a single tool call completion
 */

export interface StreamingSession {
  sessionId: string;
  conversationId?: string;
  requestSentAt: number;       // Date.now()
  firstTokenAt?: number;
  lastTokenAt?: number;
  tokenCount: number;
  toolCallCount: number;
  totalToolCallMs: number;
  completed: boolean;
  error?: string;
}

// ─── Session tracking ─────────────────────────────────────────────────────────

const _sessions = new Map<string, StreamingSession>();

export function startStreamingSession(sessionId: string, conversationId?: string): StreamingSession {
  const session: StreamingSession = {
    sessionId,
    conversationId,
    requestSentAt: Date.now(),
    tokenCount: 0,
    toolCallCount: 0,
    totalToolCallMs: 0,
    completed: false,
  };
  _sessions.set(sessionId, session);
  return session;
}

export function recordFirstToken(sessionId: string): void {
  const session = _sessions.get(sessionId);
  if (!session || session.firstTokenAt) return;
  session.firstTokenAt = Date.now();
}

export function recordToken(sessionId: string, count = 1): void {
  const session = _sessions.get(sessionId);
  if (!session) return;
  session.tokenCount += count;
  session.lastTokenAt = Date.now();
}

export function recordToolCallStart(sessionId: string): number {
  return Date.now();
}

export function recordToolCallEnd(sessionId: string, startedAt: number): void {
  const session = _sessions.get(sessionId);
  if (!session) return;
  session.toolCallCount += 1;
  session.totalToolCallMs += Date.now() - startedAt;
}

export function completeStreamingSession(sessionId: string, error?: string): StreamingMetrics | null {
  const session = _sessions.get(sessionId);
  if (!session) return null;
  session.completed = true;
  session.error = error;
  _sessions.delete(sessionId);
  return computeMetrics(session);
}

// ─── Metrics computation ──────────────────────────────────────────────────────

export interface StreamingMetrics {
  sessionId: string;
  ttftMs: number | null;        // Time to first token
  throughputTps: number | null; // Tokens per second
  totalDurationMs: number | null;
  tokenCount: number;
  toolCallCount: number;
  avgToolCallMs: number | null;
  error?: string;
}

function computeMetrics(session: StreamingSession): StreamingMetrics {
  const ttftMs = session.firstTokenAt
    ? session.firstTokenAt - session.requestSentAt
    : null;

  const totalDurationMs = session.lastTokenAt
    ? session.lastTokenAt - session.requestSentAt
    : null;

  const streamDurationMs =
    session.firstTokenAt && session.lastTokenAt
      ? session.lastTokenAt - session.firstTokenAt
      : null;

  const throughputTps =
    streamDurationMs && streamDurationMs > 0 && session.tokenCount > 0
      ? Math.round((session.tokenCount / streamDurationMs) * 1000)
      : null;

  const avgToolCallMs =
    session.toolCallCount > 0
      ? Math.round(session.totalToolCallMs / session.toolCallCount)
      : null;

  return {
    sessionId: session.sessionId,
    ttftMs,
    throughputTps,
    totalDurationMs,
    tokenCount: session.tokenCount,
    toolCallCount: session.toolCallCount,
    avgToolCallMs,
    error: session.error,
  };
}

// ─── TTFT thresholds (Voya SLA) ───────────────────────────────────────────────

export const TTFT_BUDGETS = {
  good: 500,        // < 500ms feels instant
  acceptable: 1500, // < 1.5s acceptable
  poor: 3000,       // > 3s frustrating
} as const;

export type TtftRating = "good" | "acceptable" | "poor";

export function rateTtft(ttftMs: number | null): TtftRating {
  if (ttftMs === null) return "poor";
  if (ttftMs <= TTFT_BUDGETS.good) return "good";
  if (ttftMs <= TTFT_BUDGETS.acceptable) return "acceptable";
  return "poor";
}

// ─── Reporter ─────────────────────────────────────────────────────────────────

export function reportStreamingMetrics(metrics: StreamingMetrics): void {
  if (typeof window === "undefined") return;
  const payload = {
    name: "AI_STREAMING",
    ttftMs: metrics.ttftMs,
    rating: rateTtft(metrics.ttftMs),
    throughputTps: metrics.throughputTps,
    totalDurationMs: metrics.totalDurationMs,
    tokenCount: metrics.tokenCount,
    toolCallCount: metrics.toolCallCount,
    avgToolCallMs: metrics.avgToolCallMs,
    hasError: !!metrics.error,
  };
  void fetch("/api/vitals/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([payload]),
    keepalive: true,
  }).catch(() => undefined);
}
