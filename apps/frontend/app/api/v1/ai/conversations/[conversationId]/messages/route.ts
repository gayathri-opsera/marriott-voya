/**
 * GET /api/v1/ai/conversations/:conversationId/messages — WO-007
 *
 * Returns ordered conversation history. Used to restore messages
 * after a browser refresh without requiring in-memory state.
 *
 * POST /api/v1/ai/conversations/:conversationId/messages/stream is handled
 * by apps/frontend/app/api/v1/ai/conversations/[conversationId]/messages/stream/route.ts
 */

import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE = process.env["AI_SERVICE_URL"] ?? "http://localhost:3006";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  try {
    const upstream = await fetch(
      `${AI_SERVICE}/api/v1/ai/conversations/${conversationId}/messages`,
    );
    if (!upstream.ok) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }
    const data = await upstream.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "ai_service_unavailable" },
      { status: 502 },
    );
  }
}
