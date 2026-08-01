import { NextRequest, NextResponse } from "next/server";

const AI_URL = process.env.AI_SERVICE_URL ?? "http://localhost:3006";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const upstream = await fetch(`${AI_URL}/api/v1/ai/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body || "{}",
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json({ error: "ai_service_unavailable" }, { status: 502 });
  }
}
