import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE = process.env["AI_SERVICE_URL"] ?? "http://localhost:3006";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const upstream = `${AI_SERVICE}/api/v1/ai/itineraries${url.search}`;
    const res = await fetch(upstream, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as unknown;
    const upstream = `${AI_SERVICE}/api/v1/ai/itineraries`;
    const res = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }
}
