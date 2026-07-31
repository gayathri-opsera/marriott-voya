import { NextResponse } from "next/server";

interface VitalsBody {
  name?: unknown;
  value?: unknown;
  delta?: unknown;
  id?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: VitalsBody;
  try {
    body = (await request.json()) as VitalsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
  }
  if (typeof body.value !== "number" || Number.isNaN(body.value)) {
    return NextResponse.json({ error: "value must be a number" }, { status: 400 });
  }
  if (typeof body.delta !== "number" || Number.isNaN(body.delta)) {
    return NextResponse.json({ error: "delta must be a number" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[vitals]", {
      name: body.name,
      value: body.value,
      delta: body.delta,
      id: typeof body.id === "string" ? body.id : undefined,
    });
  }

  return new NextResponse(null, { status: 204 });
}
