import { NextResponse } from "next/server";
import { z } from "zod";

const EventBodySchema = z.object({
  name: z.string().min(1).max(100),
  props: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = EventBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 422 });
  }

  // Events are accepted for downstream processing; no PII is stored here.
  return new NextResponse(null, { status: 204 });
}
