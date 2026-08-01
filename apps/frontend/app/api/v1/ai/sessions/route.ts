import { NextRequest, NextResponse } from "next/server";

// In-memory session store (same as the backend ai-service)
const sessions = new Map<string, { id: string; model: string; status: string; messageCount: number; tokenCount: number; createdAt: string; history: unknown[] }>();
let counter = 0;

export async function POST(_req: NextRequest) {
  counter += 1;
  const id = `session-${counter}-${Date.now()}`;
  const session = { id, model: "claude-sonnet-4-5", status: "active", messageCount: 0, tokenCount: 0, createdAt: new Date().toISOString(), history: [] };
  sessions.set(id, session);
  return NextResponse.json({ ...session, sessionId: id });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const session = sessions.get(id);
  if (!session) return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  const { history: _h, ...meta } = session;
  return NextResponse.json(meta);
}
