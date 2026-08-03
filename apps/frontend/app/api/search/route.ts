/**
 * GET /api/search — AI-powered property search for any destination.
 *
 * Query params:
 *   q        — destination string (e.g. "Austin, Texas")
 *   checkIn  — YYYY-MM-DD
 *   checkOut — YYYY-MM-DD
 *   guests   — number (default 2)
 *   sort     — price_asc | price_desc | rating (default price_asc)
 *
 * Returns a SearchResponse-compatible payload with real-seeming
 * Homes & Villas by Marriott Bonvoy listings generated for ANY location.
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Destination intelligence ─────────────────────────────────────────────────

const UNSPLASH_POOLS: Record<string, string[]> = {
  beach: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80&fit=crop",
  ],
  city: [
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1531685250784-7569952593d2?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1510531704581-5b2870972060?w=600&q=80&fit=crop",
  ],
  villa: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80&fit=crop",
  ],
  nature: [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80&fit=crop",
  ],
  mountain: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fit=crop",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&fit=crop",
  ],
};

type DestinationConfig = {
  type: "beach" | "city" | "villa" | "nature" | "mountain";
  currency: string;
  basePrice: number;
  collection: string;
  propertyStyles: string[];
  neighborhoods: string[];
  lat: number;
  lng: number;
  airportCode: string;
};

function getDestConfig(dest: string): DestinationConfig {
  const d = dest.toLowerCase();

  if (d.includes("austin") || d.includes("texas")) return {
    type: "city", currency: "USD", basePrice: 295,
    collection: "Urban Retreats",
    propertyStyles: ["Hill Country Ranch", "Modern Lake House", "South Congress Bungalow", "East Austin Loft", "Westlake Estate"],
    neighborhoods: ["Dripping Springs", "South Congress", "East Austin", "Westlake Hills", "Barton Hills"],
    lat: 30.2672, lng: -97.7431, airportCode: "AUS",
  };

  if (d.includes("miami") || d.includes("south beach")) return {
    type: "beach", currency: "USD", basePrice: 480,
    collection: "Beachfront Estates",
    propertyStyles: ["Beachfront Villa", "Art Deco Penthouse", "Waterfront Estate", "Modern Condo"],
    neighborhoods: ["South Beach", "Coconut Grove", "Brickell", "Star Island", "Key Biscayne"],
    lat: 25.7617, lng: -80.1918, airportCode: "MIA",
  };

  if (d.includes("new york") || d.includes("nyc") || d.includes("manhattan")) return {
    type: "city", currency: "USD", basePrice: 620,
    collection: "City Escapes",
    propertyStyles: ["Manhattan Penthouse", "Brooklyn Townhouse", "Loft Apartment", "Historic Brownstone"],
    neighborhoods: ["SoHo", "Chelsea", "Upper West Side", "Brooklyn Heights", "Tribeca"],
    lat: 40.7128, lng: -74.0060, airportCode: "JFK",
  };

  if (d.includes("los angeles") || (d.includes("la") && d.includes("california")) || d.includes("malibu") || d.includes("hollywood")) return {
    type: "city", currency: "USD", basePrice: 540,
    collection: "West Coast Living",
    propertyStyles: ["Canyon Estate", "Malibu Beachfront", "Hollywood Hills", "Silver Lake Bungalow"],
    neighborhoods: ["Malibu", "Hollywood Hills", "Silver Lake", "Venice Beach", "Bel Air"],
    lat: 34.0522, lng: -118.2437, airportCode: "LAX",
  };

  if (d.includes("nashville") || d.includes("tennessee")) return {
    type: "city", currency: "USD", basePrice: 265,
    collection: "Urban Retreats",
    propertyStyles: ["Music Row Penthouse", "Germantown Row House", "The Gulch Condo", "Belle Meade Estate"],
    neighborhoods: ["Germantown", "The Gulch", "12South", "East Nashville", "Berry Hill"],
    lat: 36.1627, lng: -86.7816, airportCode: "BNA",
  };

  if (d.includes("charleston") || d.includes("south carolina")) return {
    type: "city", currency: "USD", basePrice: 310,
    collection: "Historic Homes",
    propertyStyles: ["Historic Antebellum Mansion", "Rainbow Row Townhouse", "Isle of Palms Beach House"],
    neighborhoods: ["Historic District", "Isle of Palms", "Sullivan's Island", "French Quarter"],
    lat: 32.7765, lng: -79.9311, airportCode: "CHS",
  };

  if (d.includes("bali") || d.includes("ubud") || d.includes("seminyak") || d.includes("canggu")) return {
    type: "nature", currency: "USD", basePrice: 195,
    collection: "Homes With Zen",
    propertyStyles: ["Jungle Infinity Villa", "Rice Terrace Retreat", "Beach Club Villa", "Eco Lodge"],
    neighborhoods: ["Ubud", "Seminyak", "Canggu", "Uluwatu", "Nusa Dua"],
    lat: -8.4095, lng: 115.1889, airportCode: "DPS",
  };

  if (d.includes("lucca") || d.includes("tuscany") || d.includes("italy") || d.includes("chianti")) return {
    type: "villa", currency: "USD", basePrice: 420,
    collection: "Vineyards & Winery Homes",
    propertyStyles: ["Restored Farmhouse", "Medieval Villa", "Vineyard Estate", "Hilltop Castello"],
    neighborhoods: ["Lucca", "Chianti", "Val d'Orcia", "Montepulciano", "San Gimignano"],
    lat: 43.8429, lng: 10.5027, airportCode: "PSA",
  };

  if (d.includes("paris") || d.includes("france")) return {
    type: "city", currency: "EUR", basePrice: 520,
    collection: "European Heritage",
    propertyStyles: ["Haussmann Apartment", "Saint-Germain Townhouse", "Montmartre Studio", "Marais Loft"],
    neighborhoods: ["Le Marais", "Saint-Germain", "Montmartre", "7th Arrondissement", "Île Saint-Louis"],
    lat: 48.8566, lng: 2.3522, airportCode: "CDG",
  };

  if (d.includes("tokyo") || d.includes("kyoto") || d.includes("japan") || d.includes("osaka")) return {
    type: "city", currency: "JPY", basePrice: 380,
    collection: "Cultural Immersion",
    propertyStyles: ["Traditional Machiya", "Modern Higashiyama", "Zen Garden House", "Tokyo Penthouse"],
    neighborhoods: ["Higashiyama", "Gion", "Nishiki", "Nakameguro", "Shimokitazawa"],
    lat: 35.6762, lng: 139.6503, airportCode: "HND",
  };

  if (d.includes("london") || d.includes("uk") || d.includes("england")) return {
    type: "city", currency: "GBP", basePrice: 490,
    collection: "British Heritage",
    propertyStyles: ["Georgian Townhouse", "Chelsea Penthouse", "Notting Hill", "Cotswolds Cottage"],
    neighborhoods: ["Chelsea", "Notting Hill", "Mayfair", "Shoreditch", "Richmond"],
    lat: 51.5074, lng: -0.1278, airportCode: "LHR",
  };

  if (d.includes("maldives") || d.includes("bora bora") || d.includes("santorini") || d.includes("greece")) return {
    type: "beach", currency: "USD", basePrice: 1150,
    collection: "Island Retreats",
    propertyStyles: ["Overwater Bungalow", "Clifftop Villa", "Private Island Estate"],
    neighborhoods: [dest.split(",")[0] || dest],
    lat: 3.2028, lng: 73.2207, airportCode: "MLE",
  };

  // Generic fallback
  return {
    type: "villa", currency: "USD", basePrice: 340,
    collection: "Exclusive Escapes",
    propertyStyles: ["Private Villa", "Luxury Home", "Resort Estate", "Urban Penthouse"],
    neighborhoods: [`Central ${dest.split(",")[0]}`, `${dest.split(",")[0]} Hills`, `${dest.split(",")[0]} Waterfront`],
    lat: 0, lng: 0, airportCode: "N/A",
  };
}

function photoFor(config: DestinationConfig, index: number): string {
  const pool = UNSPLASH_POOLS[config.type] ?? UNSPLASH_POOLS.villa;
  return pool[index % pool.length];
}

const AMENITY_SETS: Record<string, string[][]> = {
  "Urban Retreats": [
    ["Private rooftop", "City views", "Full kitchen", "EV charger", "Concierge", "Gym access"],
    ["Walkable location", "Gourmet kitchen", "Workspace", "Smart home", "High-speed WiFi"],
    ["Private yard", "Hot tub", "Fire pit", "BBQ grill", "Smart TV"],
  ],
  "Beachfront Estates": [
    ["Private beach", "Infinity pool", "Boat dock", "Outdoor kitchen", "Chef service"],
    ["Ocean views", "Pool", "Walk to beach", "Cabana", "Water sports equipment"],
  ],
  "Vineyards & Winery Homes": [
    ["Private pool", "Working vineyard", "Wine cellar", "Panoramic views", "Bicycles"],
    ["Terrace", "Garden", "Wood-fired oven", "Olive press", "Sunset views"],
  ],
  "Homes With Zen": [
    ["Infinity pool", "Yoga pavilion", "Meditation garden", "Butler", "Daily breakfast"],
    ["Rice terrace views", "Spa treatment room", "Organic garden", "Outdoor shower"],
  ],
  default: [
    ["Private pool", "Garden", "Full kitchen", "WiFi", "Parking"],
    ["Terrace", "BBQ", "Smart TV", "Air conditioning", "Washer/dryer"],
  ],
};

function amenitiesFor(collection: string, seed: number): string[] {
  const sets = AMENITY_SETS[collection] ?? AMENITY_SETS.default;
  return sets[seed % sets.length];
}

function generateListings(dest: string, checkIn: string, checkOut: string, guests: number): object[] {
  const config = getDestConfig(dest);
  const nights = Math.max(1, Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  )) || 4;

  const destSlug = dest.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const results = [];

  // Generate 5-6 properties mixing price tiers
  const priceVariants = [1.0, 0.65, 1.55, 0.85, 1.25, 0.45];
  const bedroomVariants = [3, 2, 5, 2, 4, 1];
  const ratingVariants = [4.9, 4.8, 5.0, 4.7, 4.9, 4.6];
  const reviewVariants = [47, 93, 28, 156, 38, 204];

  for (let i = 0; i < Math.min(6, config.propertyStyles.length + 2); i++) {
    const styleIdx = i % config.propertyStyles.length;
    const neighborhoodIdx = i % config.neighborhoods.length;
    const mult = priceVariants[i] ?? 1.0;
    const bedrooms = bedroomVariants[i] ?? 2;
    const pricePerNight = Math.round(config.basePrice * mult);
    const totalPrice = pricePerNight * nights;

    results.push({
      id: `hvmi-${destSlug}-${String(i + 1).padStart(3, "0")}`,
      title: `${config.propertyStyles[styleIdx]} — ${config.neighborhoods[neighborhoodIdx]}`,
      details: {
        name: `${config.propertyStyles[styleIdx]} — ${config.neighborhoods[neighborhoodIdx]}`,
        location: `${config.neighborhoods[neighborhoodIdx]}, ${dest}`,
        roomType: `${bedrooms} bed · ${Math.ceil(bedrooms * 0.8)} bath · ${bedrooms * 2} guests`,
        bedrooms,
        bathrooms: Math.ceil(bedrooms * 0.8),
        maxGuests: bedrooms * 2,
        amenities: amenitiesFor(config.collection, i),
        checkIn,
        checkOut,
        nights,
        hvmiCollection: config.collection,
        highlights: `${config.propertyStyles[styleIdx]} in ${config.neighborhoods[neighborhoodIdx]} with stunning views and premium amenities.`,
        latitude: config.lat + (Math.random() * 0.05 - 0.025),
        longitude: config.lng + (Math.random() * 0.05 - 0.025),
      },
      price: String(pricePerNight),
      currency: config.currency,
      totalPrice,
      rating: ratingVariants[i] ?? 4.7,
      reviews: reviewVariants[i] ?? 50,
      provenance: "HVMI",
      tag: `HVMI:${config.collection}`,
      hvmiCollection: config.collection,
      cancellationPolicy: i < 3 ? "free" : "non_refundable",
      bonvoyPointsEstimate: Math.floor(totalPrice * 2),
      photos: [
        photoFor(config, i),
        photoFor(config, i + 1),
        photoFor(config, i + 2),
      ],
      bookingUrl: "homes-and-villas.marriott.com",
    });
  }

  return results;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q         = searchParams.get("q") ?? "";
  const checkIn   = searchParams.get("checkIn") ?? new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const checkOut  = searchParams.get("checkOut") ?? new Date(Date.now() + 34 * 86400000).toISOString().split("T")[0];
  const guests    = parseInt(searchParams.get("guests") ?? "2", 10);
  const sort      = searchParams.get("sort") ?? "price_asc";

  if (!q.trim()) {
    return NextResponse.json({ offers: [], total: 0, query: "" }, { status: 200 });
  }

  let listings = generateListings(q, checkIn, checkOut, guests);

  // Sort
  if (sort === "price_desc") {
    listings = listings.sort((a: object, b: object) => Number((b as { price: string }).price) - Number((a as { price: string }).price));
  } else if (sort === "rating") {
    listings = listings.sort((a: object, b: object) => Number((b as { rating: number }).rating) - Number((a as { rating: number }).rating));
  } else {
    listings = listings.sort((a: object, b: object) => Number((a as { price: string }).price) - Number((b as { price: string }).price));
  }

  const config = getDestConfig(q);

  return NextResponse.json({
    offers: listings,
    total: listings.length,
    query: q,
    destination: config,
    checkIn,
    checkOut,
    guests,
    meta: {
      source: "Homes & Villas by Marriott Bonvoy",
      currency: config.currency,
      generatedAt: new Date().toISOString(),
    },
  });
}
