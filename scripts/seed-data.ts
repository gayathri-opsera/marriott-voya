#!/usr/bin/env tsx
/**
 * Voya Seed Data Script
 * ────────────────────
 * Populates in-memory stores for search-service, ai-service and api-gateway
 * with realistic villa / hotel / activity data plus Unsplash photo URLs.
 *
 * Run: npx tsx scripts/seed-data.ts
 *
 * The script also writes a JSON fixture file to:
 *   apps/frontend/public/seed/properties.json
 *   apps/frontend/public/seed/itineraries.json
 *   apps/frontend/public/seed/activities.json
 *
 * These files are served by Next.js as static assets, so tests and the
 * running app can use them without live API calls.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SEED_DIR = join(ROOT, "apps/frontend/public/seed");

mkdirSync(SEED_DIR, { recursive: true });

// ─── Photo collections (all from Unsplash — allowed in next.config) ──────────

const VILLA_PHOTOS: Record<string, string[]> = {
  tuscany: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85&fit=crop",
  ],
  santorini: [
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1522781173861-0db9e74a1899?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1200&q=85&fit=crop",
  ],
  bali: [
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=85&fit=crop",
  ],
  maldives: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1540202404-1b927e27fa8b?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=85&fit=crop",
  ],
  provence: [
    "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1533050487297-09b450131914?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=85&fit=crop",
  ],
  aspen: [
    "https://images.unsplash.com/photo-1517601768280-3bb87a0b7ca7?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1200&q=85&fit=crop",
    "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=85&fit=crop",
  ],
};

const ACTIVITY_PHOTOS: Record<string, string> = {
  cycling:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75&fit=crop",
  wine:      "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600&q=75&fit=crop",
  cooking:   "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=75&fit=crop",
  truffle:   "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&q=75&fit=crop",
  dining:    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=75&fit=crop",
  transfer:  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=75&fit=crop",
  diving:    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=75&fit=crop",
  yoga:      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=75&fit=crop",
  kayaking:  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75&fit=crop",
  temple:    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=75&fit=crop",
  sunset:    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=75&fit=crop",
  snorkel:   "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=75&fit=crop",
  lavender:  "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=600&q=75&fit=crop",
  skiing:    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=75&fit=crop",
};

// ─── Properties ───────────────────────────────────────────────────────────────

export interface SeedProperty {
  id: string;
  slug: string;
  collection: string;
  type: "HVMI_VILLA" | "HOTEL" | "APARTMENT";
  provenance: "AMADEUS" | "RAPIDAPI" | "ILLUSTRATIVE";
  title: string;
  subtitle: string;
  description: string;
  destination: string;
  country: string;
  region: string;
  photos: string[];
  thumbnailUrl: string;
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  sqm: number;
  amenities: string[];
  hvmiCollection?: string;
  bonvoyPointsPerNight: number;
  bookable: boolean;
  featured: boolean;
  tags: string[];
  coordinates: { lat: number; lng: number };
  minimumStay: number;
  availability: { date: string; available: boolean; isPeakPricing?: boolean; price?: number }[];
}

function generateAvailability(basePrice: number): SeedProperty["availability"] {
  const today = new Date();
  const dates: SeedProperty["availability"] = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const ymd = d.toISOString().split("T")[0]!;
    const dayOfWeek = d.getDay();
    const isPeak = dayOfWeek === 5 || dayOfWeek === 6; // Fri/Sat peak
    const isUnavailable = Math.random() < 0.15; // ~15% booked

    dates.push({
      date: ymd,
      available: !isUnavailable,
      isPeakPricing: isPeak,
      price: isPeak ? Math.round(basePrice * 1.35) : basePrice,
    });
  }
  return dates;
}

const PROPERTIES: SeedProperty[] = [
  // ─── Tuscany / Lucca ────────────────────────────────────────────────────────
  {
    id: "prop-lucca-001",
    slug: "villa-della-torre-lucca",
    collection: "vineyards-winery",
    type: "HVMI_VILLA",
    provenance: "AMADEUS",
    title: "Villa della Torre — Lucca Historic Centre",
    subtitle: "Restored 16th-century villa with private vineyard",
    description: "Experience the pinnacle of Tuscan living in this beautifully restored Renaissance villa. Perched above Lucca's iconic terracotta rooftops, the property offers uninterrupted views over working vineyards and the Val d'Orcia valley. Elegant frescoed interiors blend seamlessly with modern comforts: a heated private pool, gourmet kitchen, and wood-burning fireplaces.",
    destination: "Lucca, Tuscany",
    country: "Italy",
    region: "Tuscany",
    photos: VILLA_PHOTOS.tuscany!,
    thumbnailUrl: VILLA_PHOTOS.tuscany![0]!,
    price: 485,
    currency: "USD",
    rating: 4.9,
    reviews: 342,
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    sqm: 320,
    amenities: ["Private pool", "Vineyard terrace", "Full kitchen", "Bicycles", "A/C", "WiFi", "Fireplace", "Wine cellar", "BBQ", "Baby cot available"],
    hvmiCollection: "Vineyards & Winery Homes",
    bonvoyPointsPerNight: 4850,
    bookable: true,
    featured: true,
    tags: ["HVMI", "Vineyard", "Historic", "Pool", "Family"],
    coordinates: { lat: 43.8429, lng: 10.5027 },
    minimumStay: 3,
    availability: generateAvailability(485),
  },
  {
    id: "prop-lucca-002",
    slug: "podere-sant-angelo-chianti",
    collection: "vineyards-winery",
    type: "HVMI_VILLA",
    provenance: "RAPIDAPI",
    title: "Podere Sant'Angelo — Chianti Countryside",
    subtitle: "Working winery estate with panoramic valley views",
    description: "A living postcard. This working winery estate sits at 350m elevation in the heart of Chianti Classico territory. Your private pool overlooks 18 hectares of Sangiovese vines. The cellar stocks 600 bottles — including your host's award-winning Brunello di Montalcino. Complimentary tasting on arrival.",
    destination: "Chianti, Tuscany",
    country: "Italy",
    region: "Tuscany",
    photos: [
      "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=85&fit=crop",
      ...VILLA_PHOTOS.tuscany!.slice(1),
    ],
    thumbnailUrl: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=85&fit=crop",
    price: 620,
    currency: "USD",
    rating: 5.0,
    reviews: 187,
    bedrooms: 5,
    bathrooms: 4,
    maxGuests: 10,
    sqm: 450,
    amenities: ["Private pool", "Working vineyard", "Olive grove", "Outdoor dining terrace", "Wine cellar", "Panoramic valley views", "WiFi", "A/C"],
    hvmiCollection: "Vineyards & Winery Homes",
    bonvoyPointsPerNight: 6200,
    bookable: true,
    featured: true,
    tags: ["HVMI", "Vineyard", "Winery", "Luxury", "Pool"],
    coordinates: { lat: 43.5037, lng: 11.2748 },
    minimumStay: 5,
    availability: generateAvailability(620),
  },
  {
    id: "prop-lucca-003",
    slug: "casa-della-pace-lucca-hills",
    collection: "zen-wellness",
    type: "HVMI_VILLA",
    provenance: "RAPIDAPI",
    title: "Casa della Pace — Lucca Hills Retreat",
    subtitle: "Zen-inspired hillside sanctuary with heated pool",
    description: "Nestled in the Luccan hills between ancient olive groves and cypress allées, Casa della Pace is a sanctuary of stillness. The certified organic garden, yoga pavilion, and Japanese-inspired bath house attract wellness seekers from across Europe. Stone-flagged terraces, sunken outdoor seating, and a heated pool complete the picture.",
    destination: "Lucca Hills, Tuscany",
    country: "Italy",
    region: "Tuscany",
    photos: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=85&fit=crop",
      ...VILLA_PHOTOS.tuscany!.slice(2),
    ],
    thumbnailUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=85&fit=crop",
    price: 395,
    currency: "USD",
    rating: 4.8,
    reviews: 256,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    sqm: 210,
    amenities: ["Heated pool", "Zen garden", "Yoga pavilion", "Organic vegetable garden", "Mountain views", "WiFi", "A/C"],
    hvmiCollection: "Homes With Zen",
    bonvoyPointsPerNight: 3950,
    bookable: true,
    featured: false,
    tags: ["HVMI", "Wellness", "Yoga", "Pool", "Organic"],
    coordinates: { lat: 43.8791, lng: 10.4893 },
    minimumStay: 2,
    availability: generateAvailability(395),
  },

  // ─── Santorini ───────────────────────────────────────────────────────────────
  {
    id: "prop-santorini-001",
    slug: "oia-cliffside-villa-santorini",
    collection: "oceanfront-retreats",
    type: "HVMI_VILLA",
    provenance: "AMADEUS",
    title: "Oia Cliffside Villa — Santorini",
    subtitle: "Iconic caldera views, infinity pool, private sunset terrace",
    description: "Carved into the white-washed cliffs of Oia, this iconic cycladic villa commands the most celebrated sunset views in the Mediterranean. The infinity pool appears to merge seamlessly with the caldera waters far below. Vaulted ceilings, cave-carved dining rooms, and a private wine cellar make this the ultimate romantic escape.",
    destination: "Oia, Santorini",
    country: "Greece",
    region: "Cyclades",
    photos: VILLA_PHOTOS.santorini!,
    thumbnailUrl: VILLA_PHOTOS.santorini![0]!,
    price: 890,
    currency: "USD",
    rating: 5.0,
    reviews: 421,
    bedrooms: 3,
    bathrooms: 3,
    maxGuests: 6,
    sqm: 280,
    amenities: ["Infinity pool", "Caldera views", "Private sunset terrace", "Cave dining room", "Wine cellar", "Butler service", "Daily housekeeping", "WiFi"],
    hvmiCollection: "Oceanfront Retreats",
    bonvoyPointsPerNight: 8900,
    bookable: true,
    featured: true,
    tags: ["HVMI", "Oceanfront", "Romance", "Honeymoon", "Sunset views"],
    coordinates: { lat: 36.4618, lng: 25.3753 },
    minimumStay: 4,
    availability: generateAvailability(890),
  },

  // ─── Bali ────────────────────────────────────────────────────────────────────
  {
    id: "prop-bali-001",
    slug: "ubud-jungle-villa-bali",
    collection: "zen-wellness",
    type: "HVMI_VILLA",
    provenance: "AMADEUS",
    title: "Ubud Jungle Villa — Bali",
    subtitle: "Rainforest canopy villa with rice terrace views",
    description: "Rise with the jungle mist. Perched above the Ayung River gorge and framed by ancient banyan trees, this architect-designed villa channels Balinese spiritual tradition through hand-carved stone and open-sided pavilions. A 15-metre infinity pool overlooks Tegallalang's emerald rice terraces. Your private butler arranges temple visits, rice field treks, and dawn yoga sessions.",
    destination: "Ubud, Bali",
    country: "Indonesia",
    region: "Bali",
    photos: VILLA_PHOTOS.bali!,
    thumbnailUrl: VILLA_PHOTOS.bali![0]!,
    price: 540,
    currency: "USD",
    rating: 4.9,
    reviews: 638,
    bedrooms: 4,
    bathrooms: 4,
    maxGuests: 8,
    sqm: 380,
    amenities: ["15m infinity pool", "Rice terrace views", "Butler service", "Spa pavilion", "Yoga deck", "Open-air dining", "Daily breakfast"],
    hvmiCollection: "Homes With Zen",
    bonvoyPointsPerNight: 5400,
    bookable: true,
    featured: true,
    tags: ["HVMI", "Jungle", "Wellness", "Culture", "Pool"],
    coordinates: { lat: -8.5069, lng: 115.2625 },
    minimumStay: 3,
    availability: generateAvailability(540),
  },

  // ─── Maldives ────────────────────────────────────────────────────────────────
  {
    id: "prop-maldives-001",
    slug: "overwater-villa-north-male-atoll",
    collection: "oceanfront-retreats",
    type: "HVMI_VILLA",
    provenance: "RAPIDAPI",
    title: "Overwater Villa — North Malé Atoll",
    subtitle: "Glass-floor villa above the Indian Ocean lagoon",
    description: "Wake to the sound of the Indian Ocean lapping beneath your villa's glass floor panels. This 320 m² overwater sanctuary features a private plunge pool cantilevered over the turquoise lagoon, a retractable sun deck, and direct water access via your own private ladder. Complimentary sunset dolphin cruise included.",
    destination: "North Malé Atoll, Maldives",
    country: "Maldives",
    region: "North Malé Atoll",
    photos: VILLA_PHOTOS.maldives!,
    thumbnailUrl: VILLA_PHOTOS.maldives![0]!,
    price: 1850,
    currency: "USD",
    rating: 5.0,
    reviews: 294,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    sqm: 320,
    amenities: ["Private plunge pool", "Glass floor panels", "Direct ocean access", "Sunset cruise", "Butler service", "Overwater deck", "Snorkelling equipment"],
    hvmiCollection: "Oceanfront Retreats",
    bonvoyPointsPerNight: 18500,
    bookable: true,
    featured: true,
    tags: ["HVMI", "Overwater", "Luxury", "Romance", "Honeymoon"],
    coordinates: { lat: 4.1755, lng: 73.5093 },
    minimumStay: 5,
    availability: generateAvailability(1850),
  },

  // ─── Provence ────────────────────────────────────────────────────────────────
  {
    id: "prop-provence-001",
    slug: "mas-des-lavandes-luberon",
    collection: "vineyards-winery",
    type: "HVMI_VILLA",
    provenance: "AMADEUS",
    title: "Mas des Lavandes — Luberon",
    subtitle: "Stone farmhouse amid Provence lavender fields",
    description: "A mas (Provençal stone farmhouse) perfectly preserved from the 18th century, now lovingly restored into a modern sanctuary. Set between rows of purple lavender and ancient rosemary hedges in the Luberon Natural Park. The heated saltwater pool overlooks Mont Ventoux. Chef's kitchen, pétanque court, and outdoor stone fireplace.",
    destination: "Luberon, Provence",
    country: "France",
    region: "Provence",
    photos: VILLA_PHOTOS.provence!,
    thumbnailUrl: VILLA_PHOTOS.provence![0]!,
    price: 560,
    currency: "USD",
    rating: 4.8,
    reviews: 178,
    bedrooms: 5,
    bathrooms: 4,
    maxGuests: 10,
    sqm: 410,
    amenities: ["Heated saltwater pool", "Lavender gardens", "Pétanque court", "Chef's kitchen", "Stone fireplace", "Wine cellar", "WiFi", "A/C"],
    hvmiCollection: "Vineyards & Winery Homes",
    bonvoyPointsPerNight: 5600,
    bookable: true,
    featured: false,
    tags: ["HVMI", "Heritage", "Garden", "Pool", "Family"],
    coordinates: { lat: 43.8441, lng: 5.3499 },
    minimumStay: 5,
    availability: generateAvailability(560),
  },

  // ─── Aspen ────────────────────────────────────────────────────────────────────
  {
    id: "prop-aspen-001",
    slug: "alpine-lodge-aspen-ski-in-out",
    collection: "mountain-chalets",
    type: "HVMI_VILLA",
    provenance: "AMADEUS",
    title: "Alpine Lodge — Aspen Ski-In/Ski-Out",
    subtitle: "Ski-in/ski-out luxury lodge with mountain hot tub",
    description: "Arrive by ski directly to your private entrance. This four-bedroom mountainside lodge sits steps from Aspen Highlands ski lifts with unobstructed views of the Elk Mountains. Post-run recovery in the outdoor heated hot tub, wood-panelled sauna, and chef's kitchen stocked with Colorado artisan provisions on arrival.",
    destination: "Aspen, Colorado",
    country: "USA",
    region: "Colorado",
    photos: VILLA_PHOTOS.aspen!,
    thumbnailUrl: VILLA_PHOTOS.aspen![0]!,
    price: 1200,
    currency: "USD",
    rating: 4.9,
    reviews: 145,
    bedrooms: 4,
    bathrooms: 4,
    maxGuests: 8,
    sqm: 360,
    amenities: ["Ski-in/ski-out", "Outdoor hot tub", "Sauna", "Fireplace", "Chef's kitchen", "Game room", "WiFi", "Ski storage"],
    hvmiCollection: "Mountain Chalets & Lodges",
    bonvoyPointsPerNight: 12000,
    bookable: true,
    featured: true,
    tags: ["HVMI", "Ski", "Luxury", "Mountains", "Spa"],
    coordinates: { lat: 39.1911, lng: -106.8175 },
    minimumStay: 4,
    availability: generateAvailability(1200),
  },
];

// ─── Activities ───────────────────────────────────────────────────────────────

export interface SeedActivity {
  id: string;
  destinationId: string;
  type: "activity" | "restaurant" | "tour" | "transport" | "attraction";
  title: string;
  description: string;
  duration: string;
  distance: string;
  price: number;
  currency: string;
  rating: number;
  photoUrl: string;
  tags: string[];
  bookUrl?: string;
}

const ACTIVITIES: SeedActivity[] = [
  // Tuscany
  { id: "act-001", destinationId: "tuscany", type: "attraction", title: "Lucca City Walls Walk", description: "Stroll or cycle the Renaissance-era walls encircling Lucca's historic centre.", duration: "1–2 hours", distance: "8 km from villa", price: 0, currency: "USD", rating: 4.8, photoUrl: ACTIVITY_PHOTOS.cycling!, tags: ["Free", "Outdoor", "Family"] },
  { id: "act-002", destinationId: "tuscany", type: "tour", title: "Chianti Wine Tour & Vineyard Visit", description: "Private guided tour through Chianti Classico with tastings at three estates.", duration: "Full day", distance: "40 km", price: 149, currency: "USD", rating: 4.9, photoUrl: ACTIVITY_PHOTOS.wine!, tags: ["Wine", "Gourmet", "Private"] },
  { id: "act-003", destinationId: "tuscany", type: "activity", title: "Truffle Hunting Experience", description: "Hunt for prized truffles with an expert guide and trained dogs in the Tuscan hills.", duration: "Half day", distance: "15 km", price: 120, currency: "USD", rating: 5.0, photoUrl: ACTIVITY_PHOTOS.truffle!, tags: ["Unique", "Culinary", "Outdoors"] },
  { id: "act-004", destinationId: "tuscany", type: "restaurant", title: "Buca di Sant'Antonio", description: "Lucca's most celebrated restaurant, serving traditional Lucchese dishes since 1782.", duration: "2–3 hours", distance: "8 km", price: 65, currency: "USD", rating: 4.7, photoUrl: ACTIVITY_PHOTOS.dining!, tags: ["Fine dining", "Historic", "Tuscan"] },
  { id: "act-005", destinationId: "tuscany", type: "activity", title: "Cooking Class in a Farmhouse", description: "Learn to make pasta, ribollita, and cantucci with a local nonna.", duration: "3 hours", distance: "5 km", price: 95, currency: "USD", rating: 4.9, photoUrl: ACTIVITY_PHOTOS.cooking!, tags: ["Cooking", "Cultural", "Family"] },
  { id: "act-006", destinationId: "tuscany", type: "transport", title: "Private Airport Transfer (Pisa)", description: "Door-to-door private transfer from Pisa International Airport.", duration: "45 min", distance: "35 km", price: 85, currency: "USD", rating: 4.8, photoUrl: ACTIVITY_PHOTOS.transfer!, tags: ["Transfer", "Private"] },

  // Santorini
  { id: "act-007", destinationId: "santorini", type: "tour", title: "Caldera Sunset Sailing Cruise", description: "Private catamaran cruise around the caldera with BBQ dinner and volcanic springs swim.", duration: "5 hours", distance: "Oia Marina", price: 220, currency: "USD", rating: 5.0, photoUrl: ACTIVITY_PHOTOS.sunset!, tags: ["Sailing", "Sunset", "Private"] },
  { id: "act-008", destinationId: "santorini", type: "activity", title: "Aegean Scuba Diving", description: "Discover ancient volcanic seabed and Aegean marine life with a PADI instructor.", duration: "3 hours", distance: "Perivolos Beach", price: 130, currency: "USD", rating: 4.9, photoUrl: ACTIVITY_PHOTOS.diving!, tags: ["Diving", "Adventure", "Marine"] },
  { id: "act-009", destinationId: "santorini", type: "restaurant", title: "Sunset Dinner at Kastro Oia", description: "Michelin-starred Aegean cuisine perched above the famous Oia sunset view.", duration: "3 hours", distance: "2 km", price: 150, currency: "USD", rating: 4.8, photoUrl: ACTIVITY_PHOTOS.dining!, tags: ["Fine dining", "Views", "Romance"] },

  // Bali
  { id: "act-010", destinationId: "bali", type: "activity", title: "Sunrise Yoga at Tegallalang", description: "Two-hour dawn yoga session on a private rice terrace platform with master instructor.", duration: "2 hours", distance: "5 km", price: 45, currency: "USD", rating: 5.0, photoUrl: ACTIVITY_PHOTOS.yoga!, tags: ["Yoga", "Wellness", "Sunrise"] },
  { id: "act-011", destinationId: "bali", type: "tour", title: "Sacred Temple & Jungle Trek", description: "Full-day guided trek through Bali's sacred temple circuit and jungle valleys.", duration: "Full day", distance: "Ubud area", price: 89, currency: "USD", rating: 4.9, photoUrl: ACTIVITY_PHOTOS.temple!, tags: ["Culture", "Trekking", "Temples"] },
  { id: "act-012", destinationId: "bali", type: "activity", title: "Balinese Cooking Class", description: "Morning market visit then cook five traditional dishes with a Balinese family.", duration: "4 hours", distance: "3 km", price: 65, currency: "USD", rating: 4.8, photoUrl: ACTIVITY_PHOTOS.cooking!, tags: ["Cooking", "Cultural", "Market"] },

  // Maldives
  { id: "act-013", destinationId: "maldives", type: "activity", title: "Bioluminescent Night Snorkel", description: "Wade into glowing waters at midnight to swim among bioluminescent plankton.", duration: "2 hours", distance: "House reef", price: 95, currency: "USD", rating: 5.0, photoUrl: ACTIVITY_PHOTOS.snorkel!, tags: ["Night", "Unique", "Marine"] },
  { id: "act-014", destinationId: "maldives", type: "activity", title: "Manta Ray Snorkelling", description: "Guided snorkel session with resident manta rays at Hanifaru Bay.", duration: "3 hours", distance: "20 km by speedboat", price: 180, currency: "USD", rating: 5.0, photoUrl: ACTIVITY_PHOTOS.diving!, tags: ["Marine", "Wildlife", "Snorkelling"] },
  { id: "act-015", destinationId: "maldives", type: "activity", title: "Dolphin Sunset Cruise", description: "Complimentary sunset cruise searching for spinner dolphins — included with villa.", duration: "1.5 hours", distance: "Lagoon", price: 0, currency: "USD", rating: 4.9, photoUrl: ACTIVITY_PHOTOS.sunset!, tags: ["Free", "Wildlife", "Sunset"] },

  // Provence
  { id: "act-016", destinationId: "provence", type: "tour", title: "Lavender Fields Guided Bike Ride", description: "Cycle through the Valensole lavender plateau in peak bloom (June–July).", duration: "4 hours", distance: "Valensole 35km", price: 65, currency: "USD", rating: 4.9, photoUrl: ACTIVITY_PHOTOS.lavender!, tags: ["Cycling", "Scenic", "Lavender"] },
  { id: "act-017", destinationId: "provence", type: "tour", title: "Luberon Village Wine Tour", description: "Visit three Appellation d'Origine Contrôlée domaines in the Luberon hills.", duration: "Full day", distance: "Luberon AOC", price: 130, currency: "USD", rating: 4.8, photoUrl: ACTIVITY_PHOTOS.wine!, tags: ["Wine", "Villages", "Gourmet"] },

  // Aspen
  { id: "act-018", destinationId: "aspen", type: "activity", title: "Helicopter Skiing — Elk Mountains", description: "Private helicopter drops to untouched powder in the Elk Mountain back-country.", duration: "Full day", distance: "Departure from lodge", price: 1200, currency: "USD", rating: 5.0, photoUrl: ACTIVITY_PHOTOS.skiing!, tags: ["Heli-ski", "Extreme", "Private", "Luxury"] },
  { id: "act-019", destinationId: "aspen", type: "tour", title: "Guided Snowshoe & Wildlife Tour", description: "Sunset snowshoe tour led by a local naturalist — watch for elk, fox, and bald eagle.", duration: "3 hours", distance: "Highlands Bowl trailhead", price: 85, currency: "USD", rating: 4.8, photoUrl: ACTIVITY_PHOTOS.skiing!, tags: ["Nature", "Wildlife", "Winter"] },
];

// ─── Itinerary samples ─────────────────────────────────────────────────────────

export interface SeedItinerary {
  id: string;
  title: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  travellers: number;
  status: "DRAFT" | "ACCEPTED" | "BOOKED";
  totalUSD: number;
  bonvoyPoints: number;
  propertyId: string;
  propertyTitle: string;
  propertyThumbnail: string;
  days: {
    date: string;
    label: string;
    items: {
      time?: string;
      type: string;
      title: string;
      detail?: string;
      price?: number;
      currency?: string;
      bonvoyPoints?: number;
      provenance?: string;
    }[];
  }[];
}

const baseDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0]!;
};

const ITINERARIES: SeedItinerary[] = [
  {
    id: "itin-tuscany-2026",
    title: "Lucca & Chianti Discovery",
    destination: "Lucca, Tuscany, Italy",
    checkIn: baseDate(14),
    checkOut: baseDate(19),
    travellers: 2,
    status: "DRAFT",
    totalUSD: 3890,
    bonvoyPoints: 24500,
    propertyId: "prop-lucca-001",
    propertyTitle: "Villa della Torre — Lucca Historic Centre",
    propertyThumbnail: VILLA_PHOTOS.tuscany![0]!,
    days: [
      {
        date: baseDate(14),
        label: "Day 1 — Arrival",
        items: [
          { time: "14:30", type: "TRANSPORT", title: "Pisa Airport → Villa della Torre", detail: "Private shuttle transfer, 45 min", price: 85, currency: "USD", provenance: "LOCAL" },
          { time: "16:00", type: "ACCOMMODATION", title: "Check-in: Villa della Torre", detail: "HVMI — Lucca Historic Centre", price: 485, currency: "USD", bonvoyPoints: 4850, provenance: "AMADEUS" },
          { time: "19:30", type: "DINING", title: "Welcome dinner at Buca di Sant'Antonio", detail: "15-min walk from villa — reservation pre-arranged", price: 65, currency: "USD" },
        ],
      },
      {
        date: baseDate(15),
        label: "Day 2 — Lucca",
        items: [
          { time: "09:00", type: "ACTIVITY", title: "Lucca City Walls Cycle Ride", detail: "Bicycles available at villa — 4.2km loop", price: 0, provenance: "LOCAL" },
          { time: "11:00", type: "ACTIVITY", title: "Duomo di Lucca & Torre Guinigi", detail: "Guided tour, €35pp — booking via Bonvoy Experiences", price: 35, currency: "USD", bonvoyPoints: 175, provenance: "BONVOY_TOURS" },
          { time: "20:00", type: "DINING", title: "Osteria Baralla", detail: "Local trattoria, no reservation needed", price: 45, currency: "USD" },
        ],
      },
      {
        date: baseDate(16),
        label: "Day 3 — Chianti Wine Tour",
        items: [
          { time: "09:30", type: "ACTIVITY", title: "Chianti Wine Tour", detail: "Private full-day, three estate lunch — Bonvoy Tours", price: 149, currency: "USD", bonvoyPoints: 1490, provenance: "BONVOY_TOURS" },
        ],
      },
      {
        date: baseDate(17),
        label: "Day 4 — Truffle Hunting & Cooking",
        items: [
          { time: "08:00", type: "ACTIVITY", title: "Truffle Hunting Experience", detail: "Expert guide + trained dogs, 4-hour morning hunt", price: 120, currency: "USD", bonvoyPoints: 1200, provenance: "BONVOY_TOURS" },
          { time: "14:00", type: "ACTIVITY", title: "Farmhouse Cooking Class", detail: "Afternoon pasta & cantucci class with villa chef", price: 95, currency: "USD" },
        ],
      },
      {
        date: baseDate(18),
        label: "Day 5 — Pisa & Departure",
        items: [
          { time: "09:00", type: "ACTIVITY", title: "Pisa Day Trip", detail: "Torre pendente + Piazza dei Miracoli", price: 25, currency: "USD" },
          { time: "14:00", type: "TRANSPORT", title: "Villa → Pisa Airport", detail: "Private shuttle transfer, 45 min", price: 85, currency: "USD" },
        ],
      },
    ],
  },
  {
    id: "itin-santorini-2026",
    title: "Santorini Honeymoon",
    destination: "Santorini, Greece",
    checkIn: baseDate(30),
    checkOut: baseDate(37),
    travellers: 2,
    status: "ACCEPTED",
    totalUSD: 8950,
    bonvoyPoints: 62300,
    propertyId: "prop-santorini-001",
    propertyTitle: "Oia Cliffside Villa — Santorini",
    propertyThumbnail: VILLA_PHOTOS.santorini![0]!,
    days: [
      {
        date: baseDate(30),
        label: "Day 1 — Arrival in Santorini",
        items: [
          { time: "15:00", type: "TRANSPORT", title: "Santorini Airport → Oia Villa", detail: "Private taxi transfer, 30 min", price: 75, currency: "USD" },
          { time: "17:00", type: "ACCOMMODATION", title: "Check-in: Oia Cliffside Villa", detail: "HVMI — Caldera Views, Oia", price: 890, currency: "USD", bonvoyPoints: 8900, provenance: "AMADEUS" },
          { time: "20:30", type: "DINING", title: "Sunset dinner at Kastro Oia", detail: "Michelin-starred — reservation confirmed", price: 150, currency: "USD" },
        ],
      },
      {
        date: baseDate(31),
        label: "Day 2 — Caldera Cruise",
        items: [
          { time: "10:00", type: "ACTIVITY", title: "Caldera Sailing Cruise", detail: "Private catamaran — BBQ lunch, hot springs swim", price: 220, currency: "USD", bonvoyPoints: 2200, provenance: "BONVOY_TOURS" },
          { time: "20:00", type: "DINING", title: "Dinner at Selene", detail: "Aegean farm-to-table cuisine, Pyrgos village", price: 130, currency: "USD" },
        ],
      },
    ],
  },
  {
    id: "itin-bali-2026",
    title: "Bali Wellness Retreat",
    destination: "Ubud, Bali, Indonesia",
    checkIn: baseDate(45),
    checkOut: baseDate(52),
    travellers: 2,
    status: "DRAFT",
    totalUSD: 5240,
    bonvoyPoints: 37800,
    propertyId: "prop-bali-001",
    propertyTitle: "Ubud Jungle Villa — Bali",
    propertyThumbnail: VILLA_PHOTOS.bali![0]!,
    days: [
      {
        date: baseDate(45),
        label: "Day 1 — Arrival in Ubud",
        items: [
          { time: "14:00", type: "TRANSPORT", title: "Denpasar Airport → Ubud Jungle Villa", detail: "Private driver, 1h 30min", price: 55, currency: "USD" },
          { time: "16:00", type: "ACCOMMODATION", title: "Check-in: Ubud Jungle Villa", detail: "HVMI — Ayung River Valley, Ubud", price: 540, currency: "USD", bonvoyPoints: 5400, provenance: "AMADEUS" },
          { time: "18:30", type: "ACTIVITY", title: "Welcome sunset yoga session", detail: "Complimentary — private deck, yoga mat provided", price: 0 },
        ],
      },
      {
        date: baseDate(46),
        label: "Day 2 — Sunrise & Rice Terraces",
        items: [
          { time: "05:30", type: "ACTIVITY", title: "Sunrise Yoga at Tegallalang", detail: "Private session on rice terrace platform", price: 45, currency: "USD" },
          { time: "10:00", type: "ACTIVITY", title: "Balinese Cooking Class", detail: "Morning market visit + cook 5 dishes", price: 65, currency: "USD" },
          { time: "17:00", type: "ACTIVITY", title: "Sacred Temple Tour", detail: "Tirta Empul & Goa Gajah with private guide", price: 89, currency: "USD", bonvoyPoints: 890, provenance: "BONVOY_TOURS" },
        ],
      },
    ],
  },
];

// ─── Write JSON fixture files ─────────────────────────────────────────────────

writeFileSync(
  join(SEED_DIR, "properties.json"),
  JSON.stringify({ properties: PROPERTIES, generatedAt: new Date().toISOString() }, null, 2),
);

writeFileSync(
  join(SEED_DIR, "activities.json"),
  JSON.stringify({ activities: ACTIVITIES, generatedAt: new Date().toISOString() }, null, 2),
);

writeFileSync(
  join(SEED_DIR, "itineraries.json"),
  JSON.stringify({ itineraries: ITINERARIES, generatedAt: new Date().toISOString() }, null, 2),
);

// Summary
console.log("✓ Seed data written to apps/frontend/public/seed/");
console.log(`  properties.json  — ${PROPERTIES.length} properties`);
console.log(`  activities.json  — ${ACTIVITIES.length} activities`);
console.log(`  itineraries.json — ${ITINERARIES.length} itineraries`);

const totalPhotos = PROPERTIES.reduce((n, p) => n + p.photos.length, 0);
console.log(`  ${totalPhotos} property photos (Unsplash CDN)`);

export { PROPERTIES, ACTIVITIES, ITINERARIES };
