import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const SYSTEM_PROMPT = `You are Voya, the AI travel assistant for Marriott Voya.

## Primary Purpose
Help users book **Homes & Villas by Marriott Bonvoy (HVMI)** private villas and build a complete trip around that villa with activities, day trips, and optional flights. The villa/accommodation booking is ALWAYS the first step.

## Booking Order — ALWAYS follow this sequence
1. **Find the right villa.** Call search_hvmi_villas immediately once you have a destination.
2. **Surface activities.** Once the user expresses interest in a villa, proactively call search_bonvoy_tours_activities.
3. **Flights (if asked).** Only call search_flights after accommodation is settled.
4. **Local transport.** Offer car rental or shuttle when relevant.

## Core Sourcing Rules
- HVMI first, always. Only fall back to Marriott hotel brands if HVMI has zero inventory.
- Activities: Marriott Bonvoy Tours & Activities for bookable experiences.
- Never show non-Marriott hotels as primary options.

## Conversation Style
- Start immediately — ask for destination + dates, then call the tools.
- One question at a time.
- Show inline results after each tool call.
- Proactive interest matching.

## Lucca Quick Reference
**HVMI Villas near Lucca:**
- Villa della Torre (Lucca Historic Centre) — €485/night, 3 bed, Vineyards & Winery Homes
- Casa della Pace (Lucca Hills) — €395/night, 2 bed, Homes With Zen
- Podere Sant'Angelo (Chianti, 18km) — €620/night, 4 bed, Vineyards & Winery Homes

**Activities (Bonvoy Tours):**
- City walls walk — free
- Historic Centre walk — €85pp
- Chianti vineyard tour — €145pp
- Cinque Terre day trip — €135pp`;

const TRAVEL_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_hvmi_villas",
    description: "HVMI-first: Search Homes & Villas by Marriott Bonvoy. Call this BEFORE any hotel search.",
    input_schema: { type: "object" as const, properties: { destination: { type: "string" }, checkIn: { type: "string" }, checkOut: { type: "string" }, guests: { type: "number" } }, required: ["destination"] },
  },
  {
    name: "search_bonvoy_tours_activities",
    description: "Search Marriott Bonvoy Tours & Activities for the destination.",
    input_schema: { type: "object" as const, properties: { destination: { type: "string" }, travelerInterests: { type: "array", items: { type: "string" } } }, required: ["destination"] },
  },
  {
    name: "search_flights",
    description: "Search for flights. Call only after accommodation is confirmed.",
    input_schema: { type: "object" as const, properties: { origin: { type: "string" }, destination: { type: "string" }, departureDate: { type: "string" }, returnDate: { type: "string" }, passengers: { type: "number" } }, required: ["origin", "destination", "departureDate"] },
  },
  {
    name: "validate_destination",
    description: "Validate destination safety, visa requirements, and travel feasibility.",
    input_schema: { type: "object" as const, properties: { destination: { type: "string" }, travelDates: { type: "string" } }, required: ["destination"] },
  },
  {
    name: "get_weather_forecast",
    description: "Get weather forecast for the destination during travel dates.",
    input_schema: { type: "object" as const, properties: { destination: { type: "string" }, startDate: { type: "string" }, endDate: { type: "string" } }, required: ["destination"] },
  },
  {
    name: "search_local_transport",
    description: "Search local transportation options at the destination.",
    input_schema: { type: "object" as const, properties: { destination: { type: "string" }, types: { type: "array", items: { type: "string" } } }, required: ["destination"] },
  },
  {
    name: "assemble_itinerary",
    description: "Assemble all agent outputs into a structured day-by-day itinerary.",
    input_schema: { type: "object" as const, properties: { destination: { type: "string" }, checkIn: { type: "string" }, checkOut: { type: "string" }, travelers: { type: "number" } }, required: ["destination", "checkIn", "checkOut", "travelers"] },
  },
];

function executeTool(name: string, input: Record<string, unknown>): string {
  const dest = (input.destination as string) || "Lucca";
  const checkIn = (input.checkIn as string) || "2026-09-10";
  const checkOut = (input.checkOut as string) || "2026-09-17";
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) || 7;
  const isLucca = dest.toLowerCase().includes("lucca") || dest.toLowerCase().includes("tuscany") || dest.toLowerCase().includes("italy");

  switch (name) {
    case "validate_destination":
      return JSON.stringify({ destination: dest, safetyLevel: "Level 1 — Exercise Normal Precautions", visaRequired: false, visaInfo: isLucca ? "EU Schengen — US passport visa-free up to 90 days" : "Check local requirements", nearestAirports: isLucca ? ["Pisa PSA (25km)", "Florence FLR (75km)"] : ["Check local airports"] });

    case "search_hvmi_villas":
      if (isLucca) {
        return JSON.stringify({
          source: "Homes & Villas by Marriott Bonvoy", searchUrl: "homes-and-villas.marriott.com/en/search/lucca-home-and-villa-rental",
          results: [
            { id: "hvmi-lucca-001", name: "Villa della Torre — Lucca Historic Centre", hvmiCollection: "Vineyards & Winery Homes", location: "Lucca, Tuscany", bedrooms: 3, pricePerNight: 485, totalPrice: 485 * nights, currency: "USD", checkIn, checkOut, nights, amenities: ["Private pool", "Terrace", "Full kitchen", "Bicycles"], bookingUrl: "homes-and-villas.marriott.com" },
            { id: "hvmi-lucca-zen-003", name: "Casa della Pace — Lucca Hills Retreat", hvmiCollection: "Homes With Zen", location: "Lucca Hills, Tuscany", bedrooms: 2, pricePerNight: 395, totalPrice: 395 * nights, currency: "USD", checkIn, checkOut, nights, amenities: ["Zen garden", "Heated pool", "Yoga terrace"], bookingUrl: "homes-and-villas.marriott.com" },
            { id: "hvmi-tuscany-002", name: "Podere Sant'Angelo — Chianti Countryside", hvmiCollection: "Vineyards & Winery Homes", location: "Montecarlo, Tuscany (18km from Lucca)", bedrooms: 4, pricePerNight: 620, totalPrice: 620 * nights, currency: "USD", checkIn, checkOut, nights, amenities: ["Private pool", "Working vineyard", "Panoramic views"], bookingUrl: "homes-and-villas.marriott.com" },
          ],
        });
      }
      return JSON.stringify({ source: "HVMI", results: [], fallbackNote: "No HVMI inventory found — consider Marriott hotel brands" });

    case "search_bonvoy_tours_activities":
      return JSON.stringify({
        source: "Marriott Bonvoy Tours & Activities (activities.marriott.com)",
        bonvoyActivities: [
          { id: "bta-001", name: "Private Walking Tour — Lucca Historic Centre & Walls", duration: "3h", price: 85, currency: "USD", bonvoyPoints: 850 },
          { id: "bta-002", name: "Tuscan Wine Tour — Chianti Vineyards & Cellar Visits", duration: "Full day", price: 145, currency: "USD", bonvoyPoints: 1450 },
          { id: "bta-003", name: "Day Trip: Florence & Chianti", duration: "Full day", price: 120, currency: "USD", bonvoyPoints: 1200 },
          { id: "bta-004", name: "Day Trip: Cinque Terre Coastal Villages", duration: "Full day", price: 135, currency: "USD", bonvoyPoints: 1350 },
        ],
        publicLandmarks: [
          { name: "Lucca City Walls Loop", price: 0, description: "4km walkable Renaissance city walls — free, always open" },
          { name: "Guinigi Tower", price: 5, description: "Medieval tower with rooftop oak trees" },
          { name: "Piazza dell'Anfiteatro", price: 0, description: "Stunning oval piazza on Roman amphitheatre foundations" },
        ],
      });

    case "search_flights":
      return JSON.stringify({
        outbound: { airline: "ITA Airways", route: `${input.origin || "your city"} → Pisa PSA`, departureDate: input.departureDate, duration: "10h 25m", stops: 1, priceUSD: 850 },
        nearestAirportNote: "Pisa (PSA) is 25km from Lucca (~30 min). Florence (FLR) is 75km (~60 min).",
        totalUSD: 1700,
      });

    case "get_weather_forecast":
      return JSON.stringify({ destination: dest, summary: "Warm and sunny — typical Tuscany September", highC: 28, lowC: 17, recommendation: "September is peak season for wine tours — vineyards are harvesting." });

    case "search_local_transport":
      return JSON.stringify({ options: [{ type: "Shuttle", provider: "Terravision", route: "Pisa Airport → Lucca", priceUSD: 18 }, { type: "Train", provider: "Trenitalia", duration: "30 min", priceUSD: 4 }, { type: "Car Rental", provider: "Hertz (Marriott partner)", pricePerDayUSD: 55 }] });

    case "assemble_itinerary":
      return JSON.stringify({ tripName: `Lucca Villa Escape`, destination: dest, checkIn, checkOut, travelers: input.travelers || 2, budgetUSD: 6500, itinerary: [{ day: "Day 1", morning: "Arrive Pisa → Villa della Torre Lucca", afternoon: "City walls bicycle ride (free)", evening: "Dinner at villa" }, { day: "Day 2", morning: "Marriott Bonvoy Walking Tour ($85pp)", afternoon: "Guinigi Tower + Piazza dell'Anfiteatro", evening: "Local market" }, { day: "Day 3", morning: "Chianti Wine Tour — full day ($145pp)", afternoon: "3 vineyard visits, estate lunch", evening: "Villa pool" }], bonvoyPointsTotal: 10060 });

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// In-memory session store shared with the sessions route
// (In production this would be Redis or a DB)
const sessionHistory = new Map<string, Anthropic.MessageParam[]>();

export async function POST(req: NextRequest) {
  const { sessionId, message } = await req.json() as { sessionId?: string; message?: string };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      };

      if (!message) {
        send({ type: "error", code: "missing_message", message: "message is required" });
        controller.close();
        return;
      }

      if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.includes("replace")) {
        send({ type: "error", code: "api_key_missing", message: "Anthropic API key not configured" });
        controller.close();
        return;
      }

      const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
      const history: Anthropic.MessageParam[] = [...(sessionHistory.get(sessionId ?? "") ?? [])];
      history.push({ role: "user", content: message });

      try {
        let totalInput = 0, totalOutput = 0;

        for (let round = 0; round < 8; round++) {
          const response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools: TRAVEL_TOOLS,
            messages: history,
          });

          totalInput += response.usage.input_tokens;
          totalOutput += response.usage.output_tokens;

          for (const block of response.content) {
            if (block.type === "text") {
              const words = block.text.split(/(\s+)/);
              for (const word of words) {
                if (word) { send({ type: "delta", content: word }); await new Promise<void>((r) => setTimeout(r, 12)); }
              }
            }
            if (block.type === "tool_use") {
              send({ type: "tool_start", toolName: block.name, toolUseId: block.id, input: block.input });
              const result = executeTool(block.name, block.input as Record<string, unknown>);
              send({ type: "tool_result", toolUseId: block.id, result: JSON.parse(result) });
              history.push({ role: "assistant", content: response.content });
              history.push({ role: "user", content: [{ type: "tool_result", tool_use_id: block.id, content: result }] });
            }
          }

          if (response.stop_reason === "end_turn") {
            if (sessionId) sessionHistory.set(sessionId, history);
            send({ type: "done", usage: { inputTokens: totalInput, outputTokens: totalOutput } });
            controller.close();
            return;
          }
          if (response.stop_reason !== "tool_use") break;
        }

        if (sessionId) sessionHistory.set(sessionId, history);
        send({ type: "done", usage: { inputTokens: totalInput, outputTokens: totalOutput } });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        send({ type: "error", code: "api_error", message: msg });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
