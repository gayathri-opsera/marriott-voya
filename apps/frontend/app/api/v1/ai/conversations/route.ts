/**
 * POST /api/v1/ai/conversations — WO-007
 *
 * Thin route adapter: validates the request with shared contracts and
 * proxies to the canonical AI service. The frontend never owns conversation
 * creation logic — it delegates to the AI service as the authority.
 */

import { NextRequest, NextResponse } from "next/server";
import { CreateConversationRequestSchema } from "@travel/contracts/ai-planning";

const AI_SERVICE = process.env["AI_SERVICE_URL"] ?? "http://localhost:3006";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = CreateConversationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const upstream = await fetch(`${AI_SERVICE}/api/v1/ai/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": req.headers.get("x-correlation-id") ?? crypto.randomUUID(),
      },
      body: JSON.stringify(parsed.data),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "ai_service_unavailable", message: "Could not reach AI service" },
      { status: 502 },
    );
  }
}
