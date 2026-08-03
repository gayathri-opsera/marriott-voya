/**
 * POST /api/v1/ai/chat
 *
 * 10-agent orchestration system per technical-approach.md:
 *   1. Safety / Destination Validation
 *   2. Hotel / Accommodation Search  ← PRIMARY revenue agent
 *   3. Restaurant Search
 *   4. Attraction Search
 *   5. Activity Search
 *   6. Local Transportation
 *   7. Weather
 *   8. Budget Tracker
 *   9. Itinerary Assembly
 *  10. Orchestrator (= Claude itself)
 *
 * All tool results are streamed as SSE events so the UI can update
 * agent status chips, map pins, and property cards in real time.
 */

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const SYSTEM_PROMPT = `You are Voya, an AI travel concierge powered by Marriott Bonvoy.

## Your Role
Plan complete trips end-to-end using Marriott's ecosystem. You orchestrate 10 specialised agents. Run them in this order:
1. validate_safety → first, always
2. search_properties → core agent, run immediately after safety clears
3. get_weather → run in parallel with properties
4. check_budget → after seeing property prices
5. search_restaurants → after accommodation is confirmed
6. search_attractions + search_activities → together
7. search_transport → last
8. build_itinerary → only when user asks to finalise

## Conversation rules
- Ask for destination, dates, guests, budget if not provided
- Run tools proactively — don't wait for the user to ask
- After each tool, show a concise inline result
- Always mention Bonvoy points earned
- Properties MUST be Marriott-owned or Marriott-partnered ONLY
- Show prices in the user's preferred currency (infer from destination)

## Output format for properties
List each property as:
**[Property Name]** · [Collection badge]
[location] · [bedrooms] bed · £[price]/night
✓ [top amenity] · ✓ [top amenity]
Earn [pts] Bonvoy points`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "validate_safety",
    description: "Safety Agent: Validates destination safety, travel advisories, visa requirements, and accessibility. ALWAYS run this first.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "City, region or country" },
        nationality: { type: "string", description: "Traveller passport/nationality if known" },
        travelMonth: { type: "string", description: "Month of travel e.g. 'December 2026'" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_properties",
    description: "Hotel/Accommodation Agent (PRIMARY): Searches Marriott-owned and partnered properties — hotels, resorts, villas, HVMI homes. This is the core revenue agent.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        checkIn: { type: "string", description: "YYYY-MM-DD" },
        checkOut: { type: "string", description: "YYYY-MM-DD" },
        guests: { type: "number" },
        budget: { type: "number", description: "Max total budget in USD/GBP/EUR" },
        preferenceType: { type: "string", description: "villa | hotel | resort | any" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_restaurants",
    description: "Restaurant Agent: Finds Marriott-owned or partnered restaurants and dining experiences at the destination.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        cuisine: { type: "array", items: { type: "string" }, description: "e.g. ['italian', 'seafood']" },
        occasion: { type: "string", description: "e.g. 'romantic dinner', 'family lunch'" },
        priceRange: { type: "string", description: "budget | mid | luxury" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_attractions",
    description: "Attraction Agent: Finds top attractions, landmarks and Marriott-partnered experiences at the destination.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        interests: { type: "array", items: { type: "string" }, description: "e.g. ['history', 'art', 'nature']" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_activities",
    description: "Activity Agent: Finds bookable activities via Marriott Bonvoy Tours & Activities — tours, sports, wellness, nightlife.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        categories: { type: "array", items: { type: "string" }, description: "e.g. ['outdoor', 'food', 'cultural', 'wellness']" },
        guests: { type: "number" },
      },
      required: ["destination"],
    },
  },
  {
    name: "get_weather",
    description: "Weather Agent: Gets weather forecast, best time to visit, and packing recommendations for the travel dates.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        month: { type: "string", description: "Month of travel e.g. 'December'" },
        travelDuration: { type: "number", description: "Number of nights" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_transport",
    description: "Transportation Agent: Finds local transport options — airport transfers, car rental (Marriott partners), shuttles.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        arrivalAirport: { type: "string" },
        needsCarRental: { type: "boolean" },
        guests: { type: "number" },
      },
      required: ["destination"],
    },
  },
  {
    name: "check_budget",
    description: "Budget Tracking Agent: Tracks total spend across all categories, ensures recommendations fit the budget, and suggests alternatives.",
    input_schema: {
      type: "object" as const,
      properties: {
        totalBudget: { type: "number", description: "Total trip budget in the trip currency" },
        currency: { type: "string", description: "e.g. GBP, USD, EUR" },
        nights: { type: "number" },
        guests: { type: "number" },
        propertyNightlyRate: { type: "number" },
        flightCostPerPerson: { type: "number" },
        activitiesBudget: { type: "number" },
        diningBudget: { type: "number" },
      },
      required: ["totalBudget"],
    },
  },
  {
    name: "search_flights",
    description: "Flights Agent: Searches flights to the destination. Only call after accommodation is confirmed.",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: { type: "string" },
        destination: { type: "string" },
        departureDate: { type: "string" },
        returnDate: { type: "string" },
        passengers: { type: "number" },
        cabinClass: { type: "string", enum: ["economy", "business", "first"] },
      },
      required: ["origin", "destination", "departureDate"],
    },
  },
  {
    name: "build_itinerary",
    description: "Itinerary Assembly Agent: Builds a complete day-by-day itinerary stitching together accommodation, restaurants, attractions, activities and transport.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string" },
        checkIn: { type: "string" },
        checkOut: { type: "string" },
        travelers: { type: "number" },
        selectedProperty: { type: "string" },
        selectedActivities: { type: "array", items: { type: "string" } },
        selectedRestaurants: { type: "array", items: { type: "string" } },
        budget: { type: "number" },
        currency: { type: "string" },
      },
      required: ["destination", "travelers"],
    },
  },
];

// ─── Destination intelligence ─────────────────────────────────────────────────

type DestData = {
  currency: string; symbol: string;
  baseHotelPrice: number; baseVillaPrice: number;
  safetyLevel: string; visaNote: string;
  airports: string[]; lat: number; lng: number;
  weather: Record<string, string>;
  localTransport: string[];
  topRestaurants: { name: string; cuisine: string; priceRange: string; bonvoyPartner: boolean }[];
  topAttractions: { name: string; type: string; ticketPrice: number; bonvoyDiscount?: number }[];
};

const DEST_DB: Record<string, DestData> = {
  hyderabad: {
    currency: "INR", symbol: "₹", baseHotelPrice: 8500, baseVillaPrice: 22000,
    safetyLevel: "Level 1 — Exercise Normal Precautions",
    visaNote: "e-Visa available for most nationalities at indianvisa-online.nic.in. Apply at least 4 days before.",
    airports: ["Rajiv Gandhi International (HYD) — 25 km from city"],
    lat: 17.3850, lng: 78.4867,
    weather: { december: "Pleasant — 15–28°C, dry season, perfect for sightseeing", january: "Cool — 12–26°C, ideal weather", june: "Hot & humid — 25–38°C, pre-monsoon", october: "Warm — 20–32°C, post-monsoon green" },
    localTransport: ["Uber/Ola rideshare (very popular)", "Metro Rail (Hyderabad Metro covers key areas)", "Auto-rickshaw (negotiated fares)", "TSRTC bus network"],
    topRestaurants: [
      { name: "Novotel Hyderabad Convention Centre Restaurant", cuisine: "Indian & International", priceRange: "luxury", bonvoyPartner: true },
      { name: "Jewel of Nizam (Marriott Hotel)", cuisine: "Hyderabadi cuisine", priceRange: "luxury", bonvoyPartner: true },
      { name: "Barbeque Nation (Marriott partner)", cuisine: "Indian BBQ", priceRange: "mid", bonvoyPartner: true },
      { name: "Paradise Biryani", cuisine: "Hyderabadi Biryani", priceRange: "budget", bonvoyPartner: false },
    ],
    topAttractions: [
      { name: "Charminar", type: "Historical landmark", ticketPrice: 25, bonvoyDiscount: 10 },
      { name: "Golconda Fort", type: "UNESCO fort complex", ticketPrice: 15 },
      { name: "Ramoji Film City", type: "Theme park & film studio", ticketPrice: 1700, bonvoyDiscount: 15 },
      { name: "Hussain Sagar Lake", type: "Waterfront & boating", ticketPrice: 0 },
      { name: "Salar Jung Museum", type: "World's largest one-man art collection", ticketPrice: 20 },
    ],
  },
  austin: {
    currency: "USD", symbol: "$", baseHotelPrice: 185, baseVillaPrice: 320,
    safetyLevel: "Level 1 — Exercise Normal Precautions",
    visaNote: "No visa required for US citizens. ESTA required for Visa Waiver Program countries.",
    airports: ["Austin-Bergstrom International (AUS) — 20 min from downtown"],
    lat: 30.2672, lng: -97.7431,
    weather: { december: "Mild — 8–18°C, low crowds, festive atmosphere", june: "Very hot — 25–38°C, outdoor pools essential", september: "Warm — 22–35°C, ACL Music Festival season", march: "Perfect — 15–25°C, South by Southwest season" },
    localTransport: ["Rideshare (Uber/Lyft — essential)", "Capital Metro bus", "B-Cycle bike share (downtown)", "Car rental essential for Hill Country"],
    topRestaurants: [
      { name: "Driskill Grill (Marriott property)", cuisine: "Modern American", priceRange: "luxury", bonvoyPartner: true },
      { name: "Stile at JW Marriott Austin", cuisine: "Italian-American", priceRange: "luxury", bonvoyPartner: true },
      { name: "La Condesa", cuisine: "Contemporary Mexican", priceRange: "mid", bonvoyPartner: false },
      { name: "Franklin Barbecue", cuisine: "Texas BBQ", priceRange: "budget", bonvoyPartner: false },
    ],
    topAttractions: [
      { name: "South Congress Avenue", type: "Shopping & dining strip", ticketPrice: 0 },
      { name: "Barton Springs Pool", type: "Natural spring swimming pool", ticketPrice: 9 },
      { name: "6th Street Entertainment District", type: "Live music & bars", ticketPrice: 0 },
      { name: "Congress Avenue Bridge Bats", type: "Natural phenomenon — world's largest urban bat colony", ticketPrice: 0 },
    ],
  },
  amalfi: {
    currency: "EUR", symbol: "€", baseHotelPrice: 380, baseVillaPrice: 680,
    safetyLevel: "Level 1 — Exercise Normal Precautions",
    visaNote: "EU Schengen — US/UK passport visa-free up to 90 days.",
    airports: ["Naples (NAP) — 65 km, 2h by ferry or 1.5h by car"],
    lat: 40.6340, lng: 14.6027,
    weather: { december: "Mild — 8–15°C, quiet & atmospheric", june: "Warm — 22–28°C, start of peak season", september: "Perfect — 22–28°C, fewer crowds, warm sea", july: "Hot — 26–32°C, peak season & crowds" },
    localTransport: ["SITA bus along the Amalfi Coast road", "Ferry between towns (most scenic option)", "Private water taxi", "Car rental (challenging on coastal roads)"],
    topRestaurants: [
      { name: "Le Sirenuse Restaurant", cuisine: "Refined Italian", priceRange: "luxury", bonvoyPartner: true },
      { name: "Ristorante La Caravella", cuisine: "Traditional Amalfitan", priceRange: "luxury", bonvoyPartner: false },
      { name: "Lido Azzurro", cuisine: "Fresh seafood", priceRange: "mid", bonvoyPartner: false },
    ],
    topAttractions: [
      { name: "Ravello Villa Rufolo Gardens", type: "Historic gardens & music festival", ticketPrice: 7 },
      { name: "Amalfi Cathedral", type: "11th-century cathedral", ticketPrice: 3 },
      { name: "Path of the Gods (Sentiero degli Dei)", type: "Clifftop hiking trail", ticketPrice: 0 },
      { name: "Blue Grotto (Grotta Azzurra)", type: "Sea cave with blue iridescent water", ticketPrice: 14 },
    ],
  },
};

function getDestData(dest: string): DestData {
  const d = dest.toLowerCase();
  for (const [key, val] of Object.entries(DEST_DB)) {
    if (d.includes(key)) return val;
  }
  // Generic fallback
  const isAsia = ["india", "china", "japan", "thailand", "vietnam", "indonesia", "bali", "singapore", "dubai", "uae"].some(k => d.includes(k));
  const isEurope = ["italy", "france", "spain", "germany", "uk", "london", "paris", "rome", "amsterdam", "portugal"].some(k => d.includes(k));
  const currency = isAsia ? "USD" : isEurope ? "EUR" : "USD";
  const baseHotel = isAsia ? 120 : isEurope ? 280 : 200;
  return {
    currency, symbol: currency === "EUR" ? "€" : "$",
    baseHotelPrice: baseHotel, baseVillaPrice: baseHotel * 2.2,
    safetyLevel: "Level 1 — Exercise Normal Precautions",
    visaNote: "Check your country's entry requirements before booking.",
    airports: [`${dest.split(",")[0]} International Airport`],
    lat: 20 + Math.random() * 20, lng: 10 + Math.random() * 60,
    weather: { december: "Check local forecast", june: "Check local forecast" },
    localTransport: ["Rideshare apps", "Local taxi", "Car rental"],
    topRestaurants: [
      { name: `Marriott ${dest.split(",")[0]} Restaurant`, cuisine: "International", priceRange: "luxury", bonvoyPartner: true },
    ],
    topAttractions: [
      { name: `${dest.split(",")[0]} City Tour`, type: "Guided tour", ticketPrice: 35, bonvoyDiscount: 10 },
    ],
  };
}

// ─── Tool execution engine ────────────────────────────────────────────────────

function execTool(name: string, input: Record<string, unknown>): object {
  const dest = (input.destination as string) || "Austin, Texas";
  const data = getDestData(dest);
  const checkIn = (input.checkIn as string) || new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
  const checkOut = (input.checkOut as string) || new Date(Date.now() + 70 * 86400000).toISOString().split("T")[0];
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) || 7;
  const guests = Number(input.guests) || 2;
  const month = (input.month as string || checkIn.slice(5, 7));
  const monthName = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][parseInt(month)] || "December";

  switch (name) {
    case "validate_safety":
      return {
        agentName: "Safety Agent", destination: dest,
        safetyLevel: data.safetyLevel,
        visaRequirement: data.visaNote,
        healthAdvisories: ["Routine vaccinations recommended", "Travel insurance advised"],
        accessibilityNote: "Destination accessible without restrictions",
        nearestAirports: data.airports,
        emergencyContacts: { police: "100 (India) / 911 (US) / 112 (EU)", localAmbulance: "Local emergency services available" },
        travelValidated: true,
        coordinates: { lat: data.lat, lng: data.lng },
      };

    case "search_properties": {
      const budget = Number(input.budget) || 999999;
      const sym = data.symbol;
      const hp = data.baseHotelPrice;
      const vp = data.baseVillaPrice;
      const destSlug = dest.toLowerCase().replace(/[^a-z0-9]/g, "-");

      const allProps = [
        {
          id: `marriott-${destSlug}-001`, type: "HVMI Villa", marriottOwned: true,
          name: `Marriott Homes & Villas — ${dest.split(",")[0]} Luxury Estate`,
          collection: "Homes & Villas by Marriott Bonvoy",
          location: dest, bedrooms: 3, bathrooms: 2, maxGuests: 6,
          pricePerNight: Math.round(vp * 1.0), totalPrice: Math.round(vp * 1.0 * nights), currency: data.currency,
          checkIn, checkOut, nights, rating: 4.9, reviews: 47,
          amenities: ["Private pool", "Full kitchen", "Concierge", "Free WiFi"],
          bonvoyPoints: Math.round(vp * 1.0 * nights * 2),
          coordinates: { lat: data.lat + 0.01, lng: data.lng + 0.01 },
          photo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80&fit=crop",
          badge: "Marriott owned",
        },
        {
          id: `marriott-${destSlug}-002`, type: "Hotel", marriottOwned: true,
          name: `JW Marriott ${dest.split(",")[0]}`,
          collection: "JW Marriott Hotels & Resorts",
          location: `${dest} City Centre`, bedrooms: 1, bathrooms: 1, maxGuests: 2,
          pricePerNight: Math.round(hp * 1.3), totalPrice: Math.round(hp * 1.3 * nights), currency: data.currency,
          checkIn, checkOut, nights, rating: 4.8, reviews: 312,
          amenities: ["Spa", "Rooftop pool", "5 restaurants", "Bonvoy tier recognition"],
          bonvoyPoints: Math.round(hp * 1.3 * nights * 2),
          coordinates: { lat: data.lat - 0.005, lng: data.lng + 0.008 },
          photo: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80&fit=crop",
          badge: "Marriott owned",
        },
        {
          id: `marriott-${destSlug}-003`, type: "Hotel", marriottOwned: true,
          name: `The Westin ${dest.split(",")[0]}`,
          collection: "Westin Hotels & Resorts",
          location: dest, bedrooms: 1, bathrooms: 1, maxGuests: 2,
          pricePerNight: Math.round(hp * 1.0), totalPrice: Math.round(hp * 1.0 * nights), currency: data.currency,
          checkIn, checkOut, nights, rating: 4.7, reviews: 218,
          amenities: ["WestinWORKOUT® Gym", "Heavenly Bed®", "Pool", "Pet-friendly"],
          bonvoyPoints: Math.round(hp * 1.0 * nights * 2),
          coordinates: { lat: data.lat + 0.008, lng: data.lng - 0.006 },
          photo: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80&fit=crop",
          badge: "Marriott owned",
        },
        {
          id: `partner-${destSlug}-004`, type: "HVMI Villa", marriottOwned: false,
          name: `${dest.split(",")[0]} Heritage Villa — Marriott Partner`,
          collection: "Marriott Bonvoy Partner Collection",
          location: `${dest} (outskirts)`, bedrooms: 4, bathrooms: 3, maxGuests: 8,
          pricePerNight: Math.round(vp * 0.85), totalPrice: Math.round(vp * 0.85 * nights), currency: data.currency,
          checkIn, checkOut, nights, rating: 4.8, reviews: 89,
          amenities: ["Private garden", "Outdoor dining", "Local staff", "Cultural experiences"],
          bonvoyPoints: Math.round(vp * 0.85 * nights * 1.5),
          coordinates: { lat: data.lat - 0.012, lng: data.lng - 0.010 },
          photo: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80&fit=crop",
          badge: "Partner",
        },
        {
          id: `marriott-${destSlug}-005`, type: "Hotel", marriottOwned: true,
          name: `Courtyard by Marriott ${dest.split(",")[0]}`,
          collection: "Courtyard by Marriott",
          location: dest, bedrooms: 1, bathrooms: 1, maxGuests: 2,
          pricePerNight: Math.round(hp * 0.65), totalPrice: Math.round(hp * 0.65 * nights), currency: data.currency,
          checkIn, checkOut, nights, rating: 4.5, reviews: 567,
          amenities: ["Business centre", "Fitness centre", "Free parking", "Great value"],
          bonvoyPoints: Math.round(hp * 0.65 * nights * 2),
          coordinates: { lat: data.lat + 0.015, lng: data.lng + 0.012 },
          photo: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80&fit=crop",
          badge: "Marriott owned",
        },
        {
          id: `partner-${destSlug}-006`, type: "Boutique Hotel", marriottOwned: false,
          name: `${dest.split(",")[0]} Boutique — Bonvoy Partner`,
          collection: "Tribute Portfolio",
          location: dest, bedrooms: 1, bathrooms: 1, maxGuests: 2,
          pricePerNight: Math.round(hp * 0.9), totalPrice: Math.round(hp * 0.9 * nights), currency: data.currency,
          checkIn, checkOut, nights, rating: 4.6, reviews: 143,
          amenities: ["Unique local character", "Rooftop bar", "Complimentary breakfast"],
          bonvoyPoints: Math.round(hp * 0.9 * nights * 1.5),
          coordinates: { lat: data.lat - 0.008, lng: data.lng + 0.015 },
          photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&fit=crop",
          badge: "Partner",
        },
        {
          id: `marriott-${destSlug}-007`, type: "Resort", marriottOwned: true,
          name: `Marriott Resort & Spa ${dest.split(",")[0]}`,
          collection: "Marriott Hotels",
          location: `${dest} (resort area)`, bedrooms: 1, bathrooms: 1, maxGuests: 3,
          pricePerNight: Math.round(hp * 1.6), totalPrice: Math.round(hp * 1.6 * nights), currency: data.currency,
          checkIn, checkOut, nights, rating: 4.9, reviews: 198,
          amenities: ["Full spa", "3 pools", "Beach access", "All-inclusive option"],
          bonvoyPoints: Math.round(hp * 1.6 * nights * 2),
          coordinates: { lat: data.lat + 0.020, lng: data.lng - 0.018 },
          photo: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80&fit=crop",
          badge: "Marriott owned",
        },
        {
          id: `partner-${destSlug}-008`, type: "Residence", marriottOwned: false,
          name: `${dest.split(",")[0]} Residences — Extended Stay`,
          collection: "Marriott Executive Apartments",
          location: dest, bedrooms: 2, bathrooms: 2, maxGuests: 4,
          pricePerNight: Math.round(hp * 0.75), totalPrice: Math.round(hp * 0.75 * nights), currency: data.currency,
          checkIn, checkOut, nights, rating: 4.6, reviews: 76,
          amenities: ["Full kitchen", "Washer/dryer", "Living area", "Great for families"],
          bonvoyPoints: Math.round(hp * 0.75 * nights * 1.5),
          coordinates: { lat: data.lat - 0.017, lng: data.lng + 0.019 },
          photo: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80&fit=crop",
          badge: "Partner",
        },
      ];

      const withinBudget = allProps.filter(p => p.totalPrice <= budget);
      const results = (withinBudget.length >= 3 ? withinBudget : allProps).slice(0, 8);

      return {
        agentName: "Accommodation Agent",
        source: "Marriott Bonvoy",
        destination: dest,
        searchCriteria: { checkIn, checkOut, nights, guests },
        totalResults: results.length,
        results,
        mapCenter: { lat: data.lat, lng: data.lng },
        currency: data.currency,
        note: `${sym}${Math.round(data.baseHotelPrice)}/night average · All properties earn Bonvoy points`,
      };
    }

    case "search_restaurants":
      return {
        agentName: "Restaurant Agent",
        destination: dest,
        results: data.topRestaurants.map((r, i) => ({
          id: `rest-${i}`, ...r,
          rating: 4.5 + Math.random() * 0.5,
          priceNote: r.priceRange === "luxury" ? `${data.symbol}${Math.round(data.baseHotelPrice * 0.15)}/person` : r.priceRange === "mid" ? `${data.symbol}${Math.round(data.baseHotelPrice * 0.07)}/person` : `${data.symbol}${Math.round(data.baseHotelPrice * 0.03)}/person`,
          bonvoyPoints: r.bonvoyPartner ? Math.round(data.baseHotelPrice * 0.15 * 3) : 0,
          bonvoyDiscount: r.bonvoyPartner ? "10% off for Bonvoy members" : null,
          reservationRequired: r.priceRange === "luxury",
        })),
        tip: "Marriott-partnered restaurants earn Bonvoy points on dining spend.",
      };

    case "search_attractions":
      return {
        agentName: "Attractions Agent",
        destination: dest,
        results: data.topAttractions.map((a, i) => ({
          id: `attr-${i}`, ...a,
          ticketPriceFormatted: a.ticketPrice === 0 ? "Free entry" : `${data.symbol}${a.ticketPrice}/person`,
          bonvoyDiscountNote: a.bonvoyDiscount ? `Bonvoy members save ${a.bonvoyDiscount}%` : null,
          recommendedDuration: "1-3 hours",
        })),
        tip: "Show your Bonvoy membership card at partnered attractions for discounts.",
      };

    case "search_activities":
      return {
        agentName: "Activities Agent",
        destination: dest,
        source: "Marriott Bonvoy Tours & Activities",
        results: [
          { id: "act-001", name: `${dest.split(",")[0]} City Highlights Private Tour`, duration: "4h", price: Math.round(data.baseHotelPrice * 0.3), currency: data.currency, bonvoyPoints: Math.round(data.baseHotelPrice * 0.3 * 3), category: "Cultural", groupSize: `Up to ${guests * 2}` },
          { id: "act-002", name: `${dest.split(",")[0]} Food & Market Walking Tour`, duration: "3h", price: Math.round(data.baseHotelPrice * 0.2), currency: data.currency, bonvoyPoints: Math.round(data.baseHotelPrice * 0.2 * 3), category: "Food & Drink", groupSize: "Small group (max 8)" },
          { id: "act-003", name: `${dest.split(",")[0]} Sunset Scenic Tour`, duration: "2.5h", price: Math.round(data.baseHotelPrice * 0.18), currency: data.currency, bonvoyPoints: Math.round(data.baseHotelPrice * 0.18 * 3), category: "Outdoor", groupSize: "Private" },
          { id: "act-004", name: `Day Trip: ${dest.split(",")[0]} Region Highlights`, duration: "Full day", price: Math.round(data.baseHotelPrice * 0.5), currency: data.currency, bonvoyPoints: Math.round(data.baseHotelPrice * 0.5 * 3), category: "Adventure", groupSize: "Private" },
        ],
      };

    case "get_weather":
      return {
        agentName: "Weather Agent",
        destination: dest, month: monthName,
        forecast: data.weather[monthName.toLowerCase()] || `Typical weather for ${monthName} — check a local weather service for exact forecasts.`,
        packingTips: ["Light layers recommended", "Comfortable walking shoes", "Sunscreen"],
        bestTimeToVisit: "Spring and autumn generally offer the most comfortable temperatures.",
        uvIndex: "Moderate — sun protection recommended",
        rainyDays: `Approximately ${Math.floor(Math.random() * 5 + 1)} rainy days expected`,
      };

    case "search_transport":
      return {
        agentName: "Transportation Agent",
        destination: dest,
        arrivalAirport: data.airports[0],
        options: [
          { type: "Airport Transfer", provider: "Marriott Concierge", detail: `Private car from ${data.airports[0]}`, price: `${data.symbol}${Math.round(data.baseHotelPrice * 0.25)}`, bonvoyPartner: true },
          ...data.localTransport.map((t, i) => ({
            type: t.split(" (")[0], provider: "Local operator", detail: t,
            price: i === 0 ? "Metered / app fare" : `~${data.symbol}${Math.round(data.baseHotelPrice * 0.05) * (i + 1)}/day`,
            bonvoyPartner: false,
          })),
          { type: "Car Rental", provider: "Hertz / Avis (Marriott partner)", detail: "Book through Marriott for Bonvoy points on rental spend", price: `From ${data.symbol}${Math.round(data.baseHotelPrice * 0.2)}/day`, bonvoyPartner: true },
        ],
      };

    case "check_budget": {
      const budget = Number(input.totalBudget) || 6000;
      const cur = (input.currency as string) || data.currency;
      const sym2 = cur === "GBP" ? "£" : cur === "EUR" ? "€" : cur === "INR" ? "₹" : "$";
      const propertyRate = Number(input.propertyNightlyRate) || data.baseHotelPrice;
      const nights2 = Number(input.nights) || 7;
      const flightPerPerson = Number(input.flightCostPerPerson) || Math.round(data.baseHotelPrice * 1.5);
      const g = Number(input.guests) || 2;
      const accom = propertyRate * nights2;
      const flights = flightPerPerson * g;
      const dining = Number(input.diningBudget) || Math.round(budget * 0.15);
      const activities = Number(input.activitiesBudget) || Math.round(budget * 0.12);
      const misc = Math.round(budget * 0.08);
      const totalSpend = accom + flights + dining + activities + misc;
      const remaining = budget - totalSpend;

      return {
        agentName: "Budget Agent",
        totalBudget: budget, currency: cur, symbol: sym2,
        breakdown: {
          accommodation: { amount: accom, label: `${nights2} nights × ${sym2}${propertyRate}/night`, status: accom <= budget * 0.5 ? "on_track" : "over" },
          flights: { amount: flights, label: `${g} passengers × ${sym2}${flightPerPerson}`, status: "estimated" },
          dining: { amount: dining, label: "Restaurants & meals", status: "on_track" },
          activities: { amount: activities, label: "Tours & experiences", status: "on_track" },
          miscellaneous: { amount: misc, label: "Transport, tips & incidentals", status: "on_track" },
        },
        totalEstimated: totalSpend,
        remaining: Math.max(0, remaining),
        status: remaining >= 0 ? "within_budget" : "over_budget",
        recommendation: remaining < 0
          ? `Consider a ${sym2}${Math.round(data.baseHotelPrice * 0.65)}/night Courtyard by Marriott to save ${sym2}${Math.round((propertyRate - data.baseHotelPrice * 0.65) * nights2)}`
          : `Great! You have ${sym2}${remaining} buffer remaining for spontaneous experiences.`,
        bonvoyPointsTotal: Math.round((accom + dining * 0.5) * 2),
      };
    }

    case "search_flights":
      return {
        agentName: "Flights Agent",
        origin: input.origin || "your city",
        destination: dest,
        note: "For live flight prices, Voya partners with major GDS providers. Integrate Amadeus or Sabre for real-time pricing.",
        estimatedRange: `${data.symbol}${Math.round(data.baseHotelPrice * 1.2)}–${data.symbol}${Math.round(data.baseHotelPrice * 2.5)} per person (economy)`,
        nearestAirport: data.airports[0],
        bonvoyNote: "Use Marriott Bonvoy Travel to earn miles on partner flights.",
      };

    case "build_itinerary": {
      const checkInDate = (input.checkIn as string) || new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
      const checkOutDate = (input.checkOut as string) || new Date(Date.now() + 70 * 86400000).toISOString().split("T")[0];
      const itinNights = Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000)) || 7;
      const days = [];
      for (let i = 0; i < Math.min(itinNights, 7); i++) {
        const dayDate = new Date(new Date(checkInDate).getTime() + i * 86400000).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
        days.push({
          day: i + 1, date: dayDate,
          morning: i === 0 ? `Arrive · Airport transfer · Check in to ${input.selectedProperty || "your Marriott property"}` : `Breakfast at hotel · ${data.topAttractions[i % data.topAttractions.length]?.name || "Local exploration"}`,
          afternoon: `${data.topAttractions[(i + 1) % data.topAttractions.length]?.name || "Free time"} · ${data.topRestaurants[i % data.topRestaurants.length]?.cuisine || "Local"} lunch`,
          evening: i === itinNights - 1 ? "Farewell dinner · Pack & prepare for departure" : `Dinner at ${data.topRestaurants[i % data.topRestaurants.length]?.name || "local restaurant"} · Evening walk`,
        });
      }
      return {
        agentName: "Itinerary Agent",
        tripTitle: `${dest} — ${itinNights}-Night Marriott Bonvoy Trip`,
        destination: dest, checkIn: checkInDate, checkOut: checkOutDate, travelers: input.travelers,
        itinerary: days,
        totalBonvoyEstimate: Math.round(data.baseHotelPrice * itinNights * 2),
        downloadUrl: "/itineraries",
      };
    }

    default:
      return { error: `Unknown agent: ${name}` };
  }
}

// ─── In-memory session store ──────────────────────────────────────────────────

const sessionHistory = new Map<string, Anthropic.MessageParam[]>();

export async function POST(req: NextRequest) {
  const body = await req.json() as { sessionId?: string; message?: string };
  const { sessionId, message } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

      if (!message) {
        send({ type: "error", code: "missing_message", message: "message is required" });
        controller.close();
        return;
      }
      if (!ANTHROPIC_API_KEY) {
        send({ type: "error", code: "api_key_missing", message: "Anthropic API key not configured" });
        controller.close();
        return;
      }

      const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
      const history: Anthropic.MessageParam[] = [...(sessionHistory.get(sessionId ?? "") ?? [])];
      history.push({ role: "user", content: message });

      try {
        let totalIn = 0, totalOut = 0;

        for (let round = 0; round < 12; round++) {
          const resp = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: history,
          });

          totalIn += resp.usage.input_tokens;
          totalOut += resp.usage.output_tokens;

          // Stream text blocks
          for (const block of resp.content) {
            if (block.type === "text") {
              const words = block.text.split(/(\s+)/);
              for (const word of words) {
                if (word) { send({ type: "delta", content: word }); await new Promise<void>(r => setTimeout(r, 8)); }
              }
            }
          }

          // Collect ALL tool calls in this round, execute them, then push ONE assistant + ONE user turn
          const toolBlocks = resp.content.filter(b => b.type === "tool_use") as Anthropic.ToolUseBlock[];
          if (toolBlocks.length > 0) {
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const block of toolBlocks) {
              send({ type: "tool_start", toolName: block.name, toolUseId: block.id, input: block.input });
              const result = execTool(block.name, block.input as Record<string, unknown>);
              send({ type: "tool_result", toolName: block.name, toolUseId: block.id, result });
              toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
            }
            // One assistant turn (the full response) + one user turn with ALL tool results
            history.push({ role: "assistant", content: resp.content });
            history.push({ role: "user", content: toolResults });
          }

          if (resp.stop_reason === "end_turn") {
            if (sessionId) sessionHistory.set(sessionId, history);
            send({ type: "done", usage: { inputTokens: totalIn, outputTokens: totalOut } });
            controller.close();
            return;
          }
          if (resp.stop_reason !== "tool_use") break;
        }

        if (sessionId) sessionHistory.set(sessionId, history);
        send({ type: "done", usage: {} });
      } catch (err) {
        send({ type: "error", code: "api_error", message: err instanceof Error ? err.message : "Unknown error" });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
  });
}
