/**
 * POST /api/v1/ai/conversations/:conversationId/messages/stream — WO-007
 *
 * Validates the request and proxies the SSE stream from the AI service.
 * Streaming responses are piped directly so the frontend client receives
 * SSE events (acknowledged, token, toolStatus, completed, error) without
 * buffering.
 */

import { NextRequest } from "next/server";
import { StreamMessageRequestSchema } from "@travel/contracts/ai-planning";

const AI_SERVICE = process.env["AI_SERVICE_URL"] ?? "http://localhost:3006";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", code: "invalid_json", message: "Request body must be valid JSON", correlationId: "n/a" })}\n\n`,
          ),
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  const parsed = StreamMessageRequestSchema.safeParse(body);
  if (!parsed.success) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", code: "validation_failed", message: "Invalid request", correlationId: "n/a" })}\n\n`,
          ),
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  const correlationId = req.headers.get("x-correlation-id") ?? crypto.randomUUID();

  try {
    const upstream = await fetch(
      `${AI_SERVICE}/api/v1/ai/conversations/${conversationId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-Id": correlationId,
        },
        body: JSON.stringify(parsed.data),
      },
    );

    // Pipe the SSE stream directly to the client
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Correlation-Id": correlationId,
      },
    });
  } catch {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", code: "ai_service_unavailable", message: "Could not reach AI service", correlationId, recoverable: false })}\n\n`,
          ),
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }
}
