import { NextRequest, NextResponse } from "next/server";

// Re-export the same in-memory store — Next.js will share the module instance
// within the same server process
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Proxy to the upstream AI service for session metadata
  try {
    const upstream = await fetch(`http://localhost:3006/api/v1/ai/sessions/${params.id}`);
    if (!upstream.ok) return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    const data = await upstream.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "ai_service_unavailable" }, { status: 502 });
  }
}
