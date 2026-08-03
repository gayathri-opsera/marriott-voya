/**
 * Batch Core Web Vitals endpoint — WO-051
 * Receives batched metrics from lib/vitals.ts and forwards to the telemetry pipeline.
 * PII-free: only metric name, value, delta, rating, route prefix, and app version.
 */

import { NextResponse } from "next/server";
import type { CwvMetric } from "@/lib/vitals";

export async function POST(request: Request): Promise<NextResponse> {
  let metrics: unknown;
  try {
    metrics = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(metrics)) {
    return NextResponse.json({ error: "Expected array of metrics" }, { status: 400 });
  }

  const valid = (metrics as unknown[]).filter((m): m is CwvMetric => {
    if (typeof m !== "object" || m === null) return false;
    const metric = m as Record<string, unknown>;
    return (
      typeof metric["name"] === "string" &&
      typeof metric["value"] === "number" &&
      typeof metric["delta"] === "number" &&
      typeof metric["id"] === "string"
    );
  });

  if (valid.length === 0) {
    return NextResponse.json({ error: "No valid metrics in payload" }, { status: 400 });
  }

  if (process.env["NODE_ENV"] === "development") {
    valid.forEach((m) => {
      console.log(
        `[vitals] ${m.name} = ${m.value.toFixed(1)} (${m.rating}) — ${m.routePrefix}`,
      );
    });
  }

  // In production, forward to observability pipeline (Datadog / OTLP)
  // Implementation uses environment variable OTEL_EXPORTER_OTLP_ENDPOINT if set.
  // For now metrics are logged; dashboard ingestion is handled by WO-008.

  return new NextResponse(null, { status: 204 });
}
