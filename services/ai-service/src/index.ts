import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from service dir first, then root as fallback
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { config } = await import("dotenv");
// src/index.ts lives at services/ai-service/src/ → .env is one level up
config({ path: path.resolve(__dirname, "../.env") });
// monorepo root is two levels up from the src/ dir
config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env["AI_SERVICE_PORT"] ?? 3006;

app.use(express.json());

// Lazy Anthropic client — reads key at request time so hot-reload works
function getAnthropicClient(): Anthropic {
  const key = process.env["ANTHROPIC_API_KEY"] ?? "";
  return new Anthropic({ apiKey: key });
}
const anthropic = getAnthropicClient();

// ─── System prompt encodes all Marriott sourcing rules from the requirements ─
const SYSTEM_PROMPT = `You are Voya, the AI travel assistant for Marriott Voya.

## Primary Purpose
Help users book **Homes & Villas by Marriott Bonvoy (HVMI)** private villas — especially in Italy (Lucca, Tuscany, Amalfi, etc.) — and then build a complete trip around that villa with activities, day trips, and optional flights. The villa/accommodation booking is ALWAYS the first step; everything else (flights, activities, car rental) comes after.

## Booking Order — ALWAYS follow this sequence
1. **Step 1: Find the right villa.** Call search_hvmi_villas immediately once you have a destination. Show the top 3 HVMI villas with price per night, collection name, and a Reserve link. HVMI-first is non-negotiable.
2. **Step 2: Surface activities.** Once the user expresses interest in a villa, proactively call search_bonvoy_tours_activities for that destination. Match to their stated interests (walking → city walls walk + Serchio valley route; wine → Chianti vineyard tour; coast → Cinque Terre day trip).
3. **Step 3: Flights (if asked or if destination needs them).** Only call search_flights after accommodation is settled, or if the user asks. Recommend Pisa (PSA) for Lucca/Tuscany.
4. **Step 4: Local transport.** Offer car rental (Pisa Airport, ~€62/day) or shuttle when relevant.

## Core Sourcing Rules (MANDATORY)
- **HVMI first, always:** search_hvmi_villas before any hotel search. Only fall back to Marriott hotel brands if HVMI has zero inventory near the destination (rare in Italy).
- **Activities:** Marriott Bonvoy Tours & Activities (activities.marriott.com) for bookable experiences + free public landmarks (city walls, piazzas, towers — always included).
- **Never show non-Marriott hotels** as primary options. Independents are not in scope.
- **Flights:** No Marriott constraint — best price/convenience wins.
- **Bonvoy points:** Tally per line item. Bonvoy Tours earn points. HVMI villa terms vary — flag this.

## Conversation Style
- **Start immediately.** Don't ask 6 questions before searching. Ask for destination + rough dates, then call the tools.
- **One question at a time.** Don't dump a numbered list of questions.
- **Be warm and specific.** "Lucca works beautifully in September — warm, quieter than August, and genuinely walkable" is better than "Great choice!"
- **Show inline results.** After each tool call, present the results in a compact, readable format (villa name, price, collection, beds).
- **Proactive interest matching.** If user says "walking" → include city walls walk and Serchio valley. "Wine" → Chianti tour. "History" → Guinigi Tower + Duomo. Don't wait to be asked.
- **Build the trip draft conversationally.** As items are confirmed, list them: "Sep 12–16: Villa della Torre, Lucca | Sep 13: Serchio valley walk | Sep 14: Chianti wine tour..."

## Lucca Quick Reference (use when destination = Lucca/Tuscany)
**HVMI Villas near Lucca:**
- Villa della Torre (Lucca Historic Centre) — €485/night, 3 bed, Vineyards & Winery Homes collection
- Casa della Pace (Lucca Hills) — €395/night, 2 bed, Homes With Zen collection
- Podere Sant'Angelo (Chianti, 18km) — €620/night, 4 bed, Vineyards & Winery Homes collection

**Activities (all Bonvoy Tours unless marked free):**
- City walls cycle/walk — free, always open
- Marriott Bonvoy Historic Centre walk — €85pp, earns Bonvoy pts
- Marriott Bonvoy Chianti vineyard tour — €145pp, full day, estate lunch
- Marriott Bonvoy Florence + Chianti day trip — €120pp
- Marriott Bonvoy Cinque Terre day trip — €135pp
- Guinigi Tower — public landmark, €5
- Pisa airport transfer — 25 min, €25 shuttle

**Nearest Marriott dining (HVMI villas have no on-property restaurant):**
- Grand Universe Lucca, Autograph Collection — 1.2km from city centre villas`;

// ─── Full Marriott agent tool suite ──────────────────────────────────────────
const TRAVEL_TOOLS: Anthropic.Tool[] = [
  {
    name: "validate_destination",
    description: "Step 5: Validate destination safety, visa requirements, travel feasibility and any geopolitical flags.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "City and country (e.g. 'Lucca, Italy')" },
        travelerNationality: { type: "string", description: "ISO country code or country name" },
        travelDates: { type: "string", description: "Date range (e.g. '2026-09-10 to 2026-09-17')" },
        durationNights: { type: "number" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_hvmi_villas",
    description: "Step 7 (HVMI-first): Search Homes & Villas by Marriott Bonvoy inventory for a destination. Always call this BEFORE search_marriott_hotels.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "City/region (e.g. 'Lucca, Tuscany')" },
        checkIn: { type: "string", description: "YYYY-MM-DD" },
        checkOut: { type: "string", description: "YYYY-MM-DD" },
        guests: { type: "number" },
        budgetPerNightUSD: { type: "number", description: "Max budget per night in USD" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_marriott_hotels",
    description: "Fallback only: Search Marriott hotel/resort brands. Call this ONLY if search_hvmi_villas returned no results.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        checkIn: { type: "string" },
        checkOut: { type: "string" },
        guests: { type: "number" },
        brands: { type: "array", items: { type: "string" }, description: "Marriott brands to include" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_bonvoy_tours_activities",
    description: "Search Marriott Bonvoy Tours & Activities (activities.marriott.com) for bookable, Bonvoy-points-earning experiences at a destination.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "City (e.g. 'Lucca')" },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "e.g. ['walking_tour','wine_tour','day_trip','cultural','outdoor']",
        },
        travelerInterests: { type: "array", items: { type: "string" }, description: "Stated interests to match proactively" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_flights",
    description: "Search for flights. No Marriott constraint — find the most convenient/affordable option.",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: { type: "string", description: "Origin city or airport (e.g. 'New York' or 'JFK')" },
        destination: { type: "string", description: "Nearest airport to destination (e.g. 'Pisa PSA or Florence FLR for Lucca')" },
        departureDate: { type: "string" },
        returnDate: { type: "string" },
        passengers: { type: "number" },
        cabinClass: { type: "string", enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"] },
      },
      required: ["origin", "destination", "departureDate"],
    },
  },
  {
    name: "search_local_transport",
    description: "Search local transportation options (promo-aware, not Marriott-exclusive). Surface Marriott tie-ins where available.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        types: { type: "array", items: { type: "string" }, description: "e.g. ['car_rental','train','taxi','shuttle']" },
      },
      required: ["destination"],
    },
  },
  {
    name: "get_weather_forecast",
    description: "Get weather forecast for the destination during travel dates.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        startDate: { type: "string" },
        endDate: { type: "string" },
      },
      required: ["destination"],
    },
  },
  {
    name: "assemble_itinerary",
    description: "Step 6-7: Assemble all agent outputs into a structured day-by-day itinerary with budget tracking and Bonvoy points totals.",
    input_schema: {
      type: "object" as const,
      properties: {
        tripName: { type: "string" },
        destination: { type: "string" },
        accommodation: { type: "object", description: "Selected villa or hotel object" },
        flights: { type: "object", description: "Outbound and return flight objects" },
        activities: { type: "array", items: { type: "object" } },
        localTransport: { type: "object" },
        budgetUSD: { type: "number" },
        travelers: { type: "number" },
        checkIn: { type: "string" },
        checkOut: { type: "string" },
      },
      required: ["destination", "checkIn", "checkOut", "travelers"],
    },
  },
  {
    name: "calculate_bonvoy_points",
    description: "Calculate Bonvoy loyalty points per booking component and total.",
    input_schema: {
      type: "object" as const,
      properties: {
        components: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["FLIGHT", "HOTEL", "VILLA_HVMI", "ACTIVITY", "DINING", "TRANSPORT"] },
              amountUSD: { type: "number" },
              memberTier: { type: "string", enum: ["MEMBER", "SILVER", "GOLD", "PLATINUM", "TITANIUM", "AMBASSADOR"] },
            },
          },
        },
      },
      required: ["components"],
    },
  },
];

// ─── Stub executors (faithfully implement all Marriott sourcing rules) ────────
function executeTool(name: string, input: Record<string, unknown>): string {
  switch (name) {

    case "validate_destination": {
      const dest = input["destination"] as string;
      const isItaly = dest.toLowerCase().includes("italy") || dest.toLowerCase().includes("lucca") || dest.toLowerCase().includes("tuscany");
      return JSON.stringify({
        destination: dest,
        safetyLevel: "Level 1 — Exercise Normal Precautions",
        geopoliticalFlags: [],
        visaRequired: false,
        visaInfo: isItaly ? "EU Schengen Zone — US passport holders: visa-free up to 90 days" : "Check local requirements",
        travelFeasibility: "Feasible — adequate time for flight distance and stated duration",
        nearestAirports: isItaly ? ["Pisa Galileo Galilei (PSA) — 25km from Lucca", "Florence Amerigo Vespucci (FLR) — 75km from Lucca"] : ["Check local airports"],
        entryRequirements: ["Valid passport (6+ months validity)", "Return/onward ticket", "Proof of accommodation"],
        healthAdvisories: ["No mandatory vaccinations for Italy"],
        validatedAt: new Date().toISOString(),
      });
    }

    case "search_hvmi_villas": {
      const dest = input["destination"] as string;
      const checkIn = (input["checkIn"] as string) || "2026-09-10";
      const checkOut = (input["checkOut"] as string) || "2026-09-17";
      const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
      const guests = (input["guests"] as number) || 2;

      // Real HVMI collection categories from homes-and-villas.marriott.com/en/collections:
      // Vineyards & Winery Homes | Homes With Zen | Rentals with Epic Pools |
      // Trending 2026 Home Rentals | Farmhouses and Barns | Mountainside & Trailside Cabins
      const isLucca = dest.toLowerCase().includes("lucca") || dest.toLowerCase().includes("tuscany");
      if (isLucca) {
        return JSON.stringify({
          source: "HVMI — Homes & Villas by Marriott Bonvoy",
          sourceUrl: "homes-and-villas.marriott.com/en/collections",
          collectionsSearched: ["Vineyards & Winery Homes", "Homes With Zen", "Rentals with Epic Pools"],
          searchRadius: "Lucca proper + 30km Tuscany radius (geographic expansion per sourcing rules)",
          results: [
            {
              id: "hvmi-lucca-001",
              name: "Villa della Torre — Lucca Historic Centre",
              type: "HVMI_VILLA",
              hvmiCollection: "Vineyards & Winery Homes",
              hvmiCollectionUrl: "homes-and-villas.marriott.com/en/collections",
              location: "Lucca, Tuscany — 400m from Renaissance city walls",
              bedrooms: 3, bathrooms: 2, maxGuests: 6,
              amenities: ["Private pool", "Terrace with vineyard views", "Full kitchen", "A/C", "WiFi", "Bicycles included"],
              pricePerNight: 485, totalPrice: 485 * nights, currency: "USD",
              bonvoyPointsEligible: "Points eligibility: confirm current HVMI loyalty terms at booking (may differ from hotel stays)",
              checkIn, checkOut, nights, guests,
              bookingUrl: "homes-and-villas.marriott.com/en/property/hvmi-lucca-001",
              radiusExpansion: false,
            },
            {
              id: "hvmi-lucca-zen-003",
              name: "Casa della Pace — Lucca Hills Retreat",
              type: "HVMI_VILLA",
              hvmiCollection: "Homes With Zen",
              hvmiCollectionUrl: "homes-and-villas.marriott.com/en/collections",
              location: "Lucca Hills, Tuscany — 8km from Lucca city centre",
              bedrooms: 2, bathrooms: 2, maxGuests: 4,
              amenities: ["Zen garden", "Heated pool", "Yoga terrace", "Full kitchen", "Mountain views", "WiFi"],
              pricePerNight: 395, totalPrice: 395 * nights, currency: "USD",
              bonvoyPointsEligible: "Points eligibility: confirm current HVMI loyalty terms at booking",
              checkIn, checkOut, nights, guests,
              bookingUrl: "homes-and-villas.marriott.com/en/property/hvmi-lucca-zen-003",
              radiusExpansion: false,
            },
            {
              id: "hvmi-tuscany-002",
              name: "Podere Sant'Angelo — Chianti Countryside",
              type: "HVMI_VILLA",
              hvmiCollection: "Vineyards & Winery Homes",
              hvmiCollectionUrl: "homes-and-villas.marriott.com/en/collections",
              location: "Montecarlo, Tuscany — 18km from Lucca (radius expansion disclosed)",
              bedrooms: 4, bathrooms: 3, maxGuests: 8,
              amenities: ["Private pool", "Working vineyard on property", "Olive grove", "Outdoor dining terrace", "Panoramic valley views", "WiFi"],
              pricePerNight: 620, totalPrice: 620 * nights, currency: "USD",
              bonvoyPointsEligible: "Points eligibility: confirm current HVMI loyalty terms at booking",
              checkIn, checkOut, nights, guests,
              note: "⚠️ HVMI radius expansion: 18km from Lucca — disclosed to user per sourcing transparency rules",
              bookingUrl: "homes-and-villas.marriott.com/en/property/hvmi-tuscany-002",
              radiusExpansion: true,
            },
          ],
          fallbackTriggered: false,
          fallbackNote: "Hotel brands NOT triggered — HVMI has adequate Lucca/Tuscany inventory",
          message: `3 HVMI properties found near ${dest} across Vineyards & Winery Homes and Homes With Zen collections`,
        });
      }
      return JSON.stringify({ source: "HVMI", results: [], fallbackTriggered: true, message: `No HVMI inventory found near ${dest} — recommend falling back to Marriott hotel brands` });
    }

    case "search_marriott_hotels": {
      const dest = input["destination"] as string;
      return JSON.stringify({
        source: "Marriott Hotel & Resort Brands (FALLBACK — HVMI had no inventory)",
        fallbackDisclosure: "⚠️ HVMI search returned no results. Showing Marriott hotel brands as fallback.",
        results: [
          { id: "mar-lucca-001", name: "Grand Universe Lucca, Autograph Collection", brand: "Autograph Collection", location: "Via Fillungo 148, Lucca", stars: 5, pricePerNight: 380, currency: "USD", bonvoyPointsPerNight: 3800, amenities: ["Rooftop terrace", "Restaurant", "Spa", "Concierge", "Curated Lucca experiences"], onPropertyActivities: ["Afternoon tea", "Horse-carriage rides", "Olive oil tasting", "Mixology classes"] },
          { id: "mar-tuscany-002", name: "Renaissance Tuscany Il Ciocco Resort & Spa", brand: "Renaissance", location: "Castelvecchio Pascoli, 25km from Lucca", stars: 4, pricePerNight: 290, currency: "USD", bonvoyPointsPerNight: 2900, amenities: ["Spa", "Pool", "Restaurant", "Tennis", "Nature trails"] },
        ],
        dest,
      });
    }

    case "search_bonvoy_tours_activities": {
      const dest = input["destination"] as string;
      const interests = (input["travelerInterests"] as string[]) || [];
      const isLucca = dest.toLowerCase().includes("lucca");

      const activities = [
        { id: "bta-001", name: "Private Walking Tour of Lucca's Historic Centre & Walls", source: "Marriott Bonvoy Tours & Activities", url: "activities.marriott.com", duration: "3 hours", price: 85, currency: "USD", bonvoyPoints: 850, category: "walking_tour", description: "Expert-guided small-group walk through Renaissance city walls, Piazza dell'Anfiteatro, Guinigi Tower", bookableIndependentOfAccommodation: true },
        { id: "bta-002", name: "Tuscan Wine Tour — Chianti Vineyards & Cellar Visits", source: "Marriott Bonvoy Tours & Activities", url: "activities.marriott.com", duration: "Full day", price: 145, currency: "USD", bonvoyPoints: 1450, category: "wine_tour", description: "Van tour through Chianti hills, 3 vineyard visits, cellar tastings, lunch at estate", bookableIndependentOfAccommodation: true },
        { id: "bta-003", name: "Day Trip: Florence & Chianti", source: "Marriott Bonvoy Tours & Activities", url: "activities.marriott.com", duration: "Full day", price: 120, currency: "USD", bonvoyPoints: 1200, category: "day_trip", description: "Guided day trip from Lucca to Florence city highlights + Chianti wine region", bookableIndependentOfAccommodation: true },
        { id: "bta-004", name: "Day Trip: Cinque Terre Coastal Villages", source: "Marriott Bonvoy Tours & Activities", url: "activities.marriott.com", duration: "Full day", price: 135, currency: "USD", bonvoyPoints: 1350, category: "day_trip", description: "Coach + boat tour through Cinque Terre's five coastal villages", bookableIndependentOfAccommodation: true },
        { id: "bta-005", name: "Self-Guided Digital Audio Walking Tour — Lucca", source: "Marriott Bonvoy Tours & Activities", url: "activities.marriott.com", duration: "Flexible (2–4 hours)", price: 18, currency: "USD", bonvoyPoints: 180, category: "walking_tour", description: "App-based audio guide covering 22 landmarks at your own pace", bookableIndependentOfAccommodation: true },
      ];

      // Proactive matching: if traveler mentioned walking/outdoors, add more
      const proactiveAdditions = [];
      if (interests.some((i) => ["walking", "outdoors", "hiking", "nature"].includes(i.toLowerCase()))) {
        proactiveAdditions.push(
          { id: "pub-001", name: "Lucca City Walls Loop — Self-guided", source: "PUBLIC_LANDMARK", category: "outdoor_walk", description: "4km walkable/cyclable Renaissance-era city walls with panoramic views — free, always open", bonvoyPoints: 0, price: 0 },
          { id: "pub-002", name: "Guinigi Tower Climb", source: "PUBLIC_LANDMARK", category: "outdoor_walk", description: "Medieval tower with rooftop oak trees and city views", bonvoyPoints: 0, price: 5 },
        );
      }

      const publicLandmarks = [
        { id: "pub-003", name: "Piazza dell'Anfiteatro", source: "PUBLIC_LANDMARK", category: "sightseeing", description: "Stunning oval piazza built on ancient Roman amphitheatre foundations", price: 0, bonvoyPoints: 0 },
        { id: "pub-004", name: "Duomo di San Martino", source: "PUBLIC_LANDMARK", category: "sightseeing", description: "Romanesque cathedral with Ilaria del Carretto tomb", price: 3, bonvoyPoints: 0 },
        { id: "pub-005", name: "Orto Botanico di Lucca", source: "PUBLIC_LANDMARK", category: "garden", description: "Historic botanical garden founded 1820", price: 4, bonvoyPoints: 0 },
      ];

      return JSON.stringify({
        destination: dest,
        source: "Marriott Bonvoy Tours & Activities (activities.marriott.com)",
        note: "All bookable activities below earn Bonvoy points and are available independent of accommodation type (villa or hotel guests both qualify)",
        bonvoyActivities: isLucca ? activities : activities.slice(0, 2),
        proactiveMatches: proactiveAdditions,
        publicLandmarks,
        totalBonvoyPointsAvailable: activities.reduce((s, a) => s + a.bonvoyPoints, 0),
      });
    }

    case "search_flights": {
      const origin = input["origin"] as string;
      const dest = (input["destination"] as string) || "PSA";
      const dep = (input["departureDate"] as string) || "2026-09-10";
      const ret = input["returnDate"] as string | undefined;
      const pax = (input["passengers"] as number) || 2;
      const cabin = (input["cabinClass"] as string) || "ECONOMY";
      const mult = cabin === "BUSINESS" ? 4 : cabin === "FIRST" ? 8 : 1;

      const priceBase = Math.floor(Math.random() * 300 + 500) * mult * pax;
      return JSON.stringify({
        outbound: {
          airline: "Alitalia / ITA Airways", flightNumber: `AZ${Math.floor(Math.random() * 900 + 100)}`,
          route: `${origin} → Pisa (PSA)`, departureDate: dep,
          departureTime: "10:15", arrivalTime: "23:40", duration: "10h 25m", stops: 1,
          cabin, priceUSD: priceBase, perPassenger: Math.floor(priceBase / pax),
        },
        return: ret ? {
          airline: "American Airlines", flightNumber: `AA${Math.floor(Math.random() * 900 + 100)}`,
          route: `Pisa (PSA) → ${origin}`, departureDate: ret,
          departureTime: "14:30", arrivalTime: "18:15 (+1)", duration: "10h 45m", stops: 1,
          cabin, priceUSD: Math.floor(priceBase * 0.9),
        } : null,
        nearestAirportNote: "Pisa (PSA) is 25km from Lucca (~30 min by taxi/shuttle). Florence (FLR) is 75km (~60 min).",
        totalRoundTripUSD: ret ? priceBase + Math.floor(priceBase * 0.9) : priceBase,
        bonvoyPoints: 0,
        bonvoyNote: "Flights do not earn Bonvoy points directly. Consider Marriott Bonvoy credit card for points on purchases.",
      });
    }

    case "search_local_transport": {
      const dest = input["destination"] as string;
      return JSON.stringify({
        destination: dest,
        options: [
          { type: "Airport Shuttle", provider: "Terravision / GoOpti", route: "Pisa Airport → Lucca city centre", priceUSD: 18, perPerson: true, note: "Marriott promo: 10% off with Bonvoy member discount code" },
          { type: "Car Rental", provider: "Hertz (Marriott partner)", pricePerDayUSD: 55, recommended: "For vineyard day trips outside Lucca", note: "Marriott Bonvoy members get complimentary upgrades at Hertz" },
          { type: "Train", provider: "Trenitalia", route: "Pisa Centrale → Lucca", duration: "30 min", priceUSD: 4, note: "Most frequent option, runs hourly" },
          { type: "Bicycle Rental", provider: "Lucca Bikes (local — promo-aware only)", pricePerDayUSD: 12, note: "Perfect for city walls loop. Not Marriott-owned but surfaced as essential local transport." },
        ],
        marriottTieIns: ["Hertz partnership", "Bonvoy member shuttle discount"],
      });
    }

    case "get_weather_forecast": {
      const dest = input["destination"] as string;
      const start = input["startDate"] as string;
      return JSON.stringify({
        destination: dest,
        period: `${start} – ${input["endDate"] || "7 days later"}`,
        summary: "Warm and sunny — typical Tuscany September. Ideal for outdoor activities and wine tours.",
        dailyForecast: [
          { day: "Day 1", condition: "Sunny", highC: 28, lowC: 17, precipChance: 5 },
          { day: "Day 2", condition: "Partly cloudy", highC: 26, lowC: 16, precipChance: 10 },
          { day: "Day 3", condition: "Sunny", highC: 29, lowC: 18, precipChance: 0 },
          { day: "Day 4", condition: "Sunny", highC: 30, lowC: 19, precipChance: 0 },
          { day: "Day 5", condition: "Partly cloudy", highC: 27, lowC: 17, precipChance: 15 },
          { day: "Day 6", condition: "Sunny", highC: 28, lowC: 16, precipChance: 5 },
          { day: "Day 7", condition: "Sunny", highC: 29, lowC: 18, precipChance: 0 },
        ],
        recommendation: "September is peak season for wine tours — vineyards are harvesting. Bring light layers for evenings.",
      });
    }

    case "assemble_itinerary": {
      const dest = input["destination"] as string;
      const checkIn = input["checkIn"] as string;
      const nights = 7;
      const travelers = (input["travelers"] as number) || 2;

      const start = new Date(checkIn);
      const days = Array.from({ length: nights }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const dayLabel = `Day ${i + 1} — ${dayNames[date.getDay()]} ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

        const plans: Record<number, { morning: string; afternoon: string; evening: string; source: string }> = {
          0: { morning: "Arrive Pisa (PSA) → shuttle/taxi to Villa della Torre Lucca (25 min)", afternoon: "Settle in, explore city walls on bicycles (4km loop) — free, open always", evening: "Dinner in villa kitchen or rooftop terrace with Chianti from Tuscan market", source: "HVMI Villa + PUBLIC_LANDMARK" },
          1: { morning: "Marriott Bonvoy Walking Tour: Historic Centre & City Walls (3h, $85pp)", afternoon: "Guinigi Tower climb ($5) — rooftop oak tree views; Piazza dell'Anfiteatro coffee", evening: "Explore local markets near Piazza Napoleone", source: "Bonvoy Tours & Activities + PUBLIC_LANDMARKS" },
          2: { morning: "Marriott Bonvoy Tuscan Wine Tour: Chianti Vineyards & Cellar Visits (full day, $145pp)", afternoon: "3 vineyard visits, cellar tastings, estate lunch included", evening: "Return to villa; relaxed evening by pool", source: "Bonvoy Tours & Activities" },
          3: { morning: "Marriott Bonvoy Day Trip: Florence & Chianti (full day, $120pp)", afternoon: "Florence Duomo, Uffizi exterior, Ponte Vecchio + Chianti wine region", evening: "Late return to Lucca", source: "Bonvoy Tours & Activities" },
          4: { morning: "Marriott Bonvoy Day Trip: Cinque Terre Coastal Villages (full day, $135pp)", afternoon: "Coach + boat through 5 coastal villages (Vernazza, Monterosso, Manarola)", evening: "Late return; last evening at villa pool", source: "Bonvoy Tours & Activities" },
          5: { morning: "Self-guided audio tour of Duomo di San Martino + Orto Botanico ($4)", afternoon: "Free time: local market, last vineyard run, souvenir shopping", evening: "Final villa dinner with remaining Chianti", source: "PUBLIC_LANDMARKS + ILLUSTRATIVE" },
          6: { morning: "Check out of villa; shuttle to Pisa airport (25 min)", afternoon: "Depart Pisa (PSA) → home", evening: "In transit", source: "Flights + Local Transport" },
        };

        return { day: dayLabel, ...plans[i] };
      });

      const villaCost = 485 * nights * travelers;
      const flightCost = 1200 * travelers;
      const activitiesCost = (85 + 145 + 120 + 135 + 18 + 4 + 3) * travelers;
      const transportCost = 36 + 55 * 3;
      const totalCost = villaCost + flightCost + activitiesCost + transportCost;

      return JSON.stringify({
        tripName: `Lucca Villa Escape — ${dest}`,
        destination: dest,
        travelers,
        checkIn, checkOut: new Date(start.setDate(start.getDate() + nights)).toISOString().split("T")[0],
        itinerary: days,
        accommodationSource: "HVMI — Homes & Villas by Marriott Bonvoy (primary, not a fallback)",
        activitySource: "Marriott Bonvoy Tours & Activities (activities.marriott.com)",
        budget: {
          totalUSD: totalCost,
          breakdown: {
            "Villa (7 nights × $485 × 2 guests)": villaCost,
            "Flights (round-trip, 2 passengers)": flightCost,
            "Activities (Bonvoy Tours × 2)": activitiesCost,
            "Local transport": transportCost,
          },
        },
        bonvoyPointsSummary: {
          "Walking Tour (2 pax × 850pts)": 1700,
          "Wine Tour (2 pax × 1450pts)": 2900,
          "Florence Day Trip (2 pax × 1200pts)": 2400,
          "Cinque Terre Day Trip (2 pax × 1350pts)": 2700,
          "Audio Tour (2 pax × 180pts)": 360,
          "HVMI Villa": "Points-earning subject to current Marriott HVMI loyalty terms — confirm at booking",
          "Flights": "0 (no Marriott constraint — no Bonvoy points)",
          TOTAL_CONFIRMED: 10060,
        },
        openItems: [
          "On-property dining gap: HVMI villas have no restaurant. Nearest Marriott dining: Grand Universe Lucca (Autograph Collection) — 1.2km from villa",
          "HVMI Bonvoy points: confirm current terms at booking — may differ from hotel stays",
        ],
      });
    }

    case "calculate_bonvoy_points": {
      const components = (input["components"] as Array<{ type: string; amountUSD: number; memberTier?: string }>) || [];
      const tierBonus: Record<string, number> = { MEMBER: 1, SILVER: 1.25, GOLD: 1.5, PLATINUM: 2, TITANIUM: 2.5, AMBASSADOR: 3 };

      const breakdown = components.map((c) => {
        const rate = c.type === "ACTIVITY" ? 10 : c.type === "HOTEL" ? 10 : c.type === "VILLA_HVMI" ? 0 : c.type === "FLIGHT" ? 0 : 5;
        const mult = tierBonus[c.memberTier ?? "MEMBER"] ?? 1;
        const pts = Math.floor(c.amountUSD * rate * mult);
        return { ...c, pointsRate: rate, tierMultiplier: mult, pointsEarned: pts, note: c.type === "VILLA_HVMI" ? "Confirm HVMI Bonvoy terms" : c.type === "FLIGHT" ? "Flights don't earn Bonvoy" : undefined };
      });

      return JSON.stringify({
        breakdown,
        totalConfirmed: breakdown.reduce((s, c) => s + (c.pointsEarned || 0), 0),
        cashValueAtStdRate: `$${(breakdown.reduce((s, c) => s + (c.pointsEarned || 0), 0) * 0.008).toFixed(2)}`,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ─── Session store ─────────────────────────────────────────────────────────
interface Session {
  id: string;
  model: string;
  status: string;
  messageCount: number;
  tokenCount: number;
  createdAt: string;
  history: Anthropic.MessageParam[];
  itinerary?: object;
}

let sessionCounter = 0;
const sessions = new Map<string, Session>();

// ─── Routes ────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  const key = process.env["ANTHROPIC_API_KEY"] ?? "";
  res.json({ status: "ok", service: "ai-service", model: "claude-sonnet-4-5", apiKeyConfigured: !!key && !key.includes("replace") });
});

app.post("/api/v1/ai/sessions", (_req, res) => {
  sessionCounter += 1;
  const id = `session-${sessionCounter}-${Date.now()}`;
  const session: Session = { id, model: "claude-sonnet-4-5", status: "active", messageCount: 0, tokenCount: 0, createdAt: new Date().toISOString(), history: [] };
  sessions.set(id, session);
  res.json(session);
});

app.get("/api/v1/ai/sessions/:id", (req, res) => {
  const session = sessions.get(req.params["id"]);
  if (!session) return res.status(404).json({ error: "session_not_found" });
  const { history: _h, ...meta } = session;
  return res.json(meta);
});

app.get("/api/v1/ai/sessions/:id/itinerary", (req, res) => {
  const session = sessions.get(req.params["id"]);
  if (!session) return res.status(404).json({ error: "session_not_found" });
  if (!session.itinerary) return res.status(404).json({ error: "no_itinerary_yet" });
  return res.json(session.itinerary);
});

// ─── Streaming chat with full agentic loop ──────────────────────────────────
app.post("/api/v1/ai/chat", async (req, res) => {
  const { sessionId, message } = req.body as { sessionId?: string; message?: string };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (chunk: object) => res.write(`data: ${JSON.stringify(chunk)}\n\n`);

  if (!message) { send({ type: "error", code: "missing_message", message: "message is required" }); return res.end(); }

  const session = sessionId ? sessions.get(sessionId) : null;
  const history: Anthropic.MessageParam[] = session ? [...session.history] : [];
  history.push({ role: "user", content: message });

  try {
    let totalInput = 0, totalOutput = 0;
    // Re-read key at request time so a restart isn't needed after .env is added
    const client = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] ?? "" });

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

      // Stream text deltas word-by-word
      for (const block of response.content) {
        if (block.type === "text") {
          const words = block.text.split(/(\s+)/);
          for (const word of words) {
            if (word) { send({ type: "delta", content: word }); await new Promise<void>((r) => setTimeout(r, 12)); }
          }
        }
        if (block.type === "tool_use") {
          send({ type: "tool_start", toolName: block.name, toolUseId: block.id, input: block.input });
        }
      }

      if (response.stop_reason !== "tool_use") {
        history.push({ role: "assistant", content: response.content });
        if (session) {
          session.history = history;
          session.messageCount += 1;
          session.tokenCount += totalInput + totalOutput;
          // Save itinerary if assembled
          const itBlock = response.content.find((b) => b.type === "text" && b.text.includes("assemble_itinerary"));
          if (itBlock) session.itinerary = { assembledAt: new Date().toISOString() };
        }
        send({ type: "done", usage: { inputTokens: totalInput, outputTokens: totalOutput } });
        break;
      }

      // Execute tools
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = executeTool(block.name, block.input as Record<string, unknown>);
          send({ type: "tool_result", toolName: block.name, toolUseId: block.id });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });

          // Save itinerary if assembled
          if (block.name === "assemble_itinerary" && session) {
            try { session.itinerary = JSON.parse(result); } catch { /* ignore */ }
          }
        }
      }
      history.push({ role: "assistant", content: response.content });
      history.push({ role: "user", content: toolResults });
    }
  } catch (err) {
    send({ type: "error", code: "api_error", message: err instanceof Error ? err.message : "Anthropic API error" });
  }

  res.end();
});

app.listen(PORT, () => {
  console.log(`[ai-service] listening on :${PORT}`);
  console.log(`  model: claude-sonnet-4-5`);
  console.log(`  tools: ${TRAVEL_TOOLS.length} Marriott agents`);
  const key = process.env["ANTHROPIC_API_KEY"] ?? "";
  console.log(`  api key: ${key && !key.includes("replace") ? "✓ configured" : "✗ missing"}`);
});

export default app;
