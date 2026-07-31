import express from "express";
import type { Request, Response } from "express";
import "dotenv/config";

const app = express();
const PORT = process.env["SEARCH_SERVICE_PORT"] ?? 3005;

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", service: "search-service" }));

// ─── Demo data generators ──────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function flightOffers(q: string, sort: string) {
  const dest = (q || "LHR").toUpperCase().slice(0, 3);
  const origins = ["JFK", "LAX", "ORD", "SFO", "MIA"];
  const origin = origins[rand(0, origins.length - 1)];

  const raw = [
    { provenance: "AMADEUS",     airline: "American Airlines", flightNumber: `AA${rand(100,999)}`, price: rand(420, 680),  seatClass: "ECONOMY",         stops: 0, duration: "7h 20m" },
    { provenance: "AMADEUS",     airline: "British Airways",   flightNumber: `BA${rand(100,999)}`, price: rand(380, 620),  seatClass: "ECONOMY",         stops: 1, duration: "9h 05m" },
    { provenance: "RAPIDAPI",    airline: "Delta",             flightNumber: `DL${rand(100,999)}`, price: rand(1800, 2600),seatClass: "BUSINESS",        stops: 0, duration: "7h 10m" },
    { provenance: "RAPIDAPI",    airline: "United Airlines",   flightNumber: `UA${rand(100,999)}`, price: rand(950, 1400), seatClass: "PREMIUM_ECONOMY", stops: 0, duration: "7h 45m" },
    { provenance: "ILLUSTRATIVE",airline: "Virgin Atlantic",   flightNumber: `VS${rand(100,999)}`, price: rand(3200, 5500),seatClass: "FIRST",           stops: 0, duration: "6h 55m" },
    { provenance: "AMADEUS",     airline: "Lufthansa",         flightNumber: `LH${rand(100,999)}`, price: rand(480, 720),  seatClass: "ECONOMY",         stops: 1, duration: "10h 20m" },
  ];

  const offers = raw.map((r, i) => ({
    id: `offer-flight-${i + 1}-${Date.now()}`,
    provenance: r.provenance,
    bookable: r.provenance !== "ILLUSTRATIVE",
    title: `${r.airline} · ${origin} → ${dest}`,
    price: `${r.price}.00`,
    currency: "USD",
    rating: parseFloat((rand(38, 50) / 10).toFixed(1)),
    reviews: rand(120, 4800),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    details: {
      airline: r.airline,
      flightNumber: r.flightNumber,
      departureAirport: origin,
      arrivalAirport: dest,
      departureTime: "08:30",
      arrivalTime: "20:50",
      duration: r.duration,
      stops: r.stops,
      seatClass: r.seatClass,
    },
  }));

  if (sort === "price_asc" || !sort) offers.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  if (sort === "price_desc") offers.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  if (sort === "rating")     offers.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return offers;
}

function hotelOffers(q: string, sort: string) {
  const city = q || "London";
  const isLucca = /lucca|tuscany|italy/i.test(city);

  // ── HVMI villas: sourced from real Homes & Villas by Marriott Bonvoy collections ──
  // Collections reference: homes-and-villas.marriott.com/en/collections
  // Lucca/Tuscany matches: "Vineyards & Winery Homes", "Rentals with Epic Pools", "Homes With Zen"
  const hvmiVillas = isLucca ? [
    {
      provenance: "AMADEUS", name: "Villa della Torre — Lucca Historic Centre", stars: 5, price: 485, type: "HVMI_VILLA",
      amenities: ["Private pool", "Terrace with vineyard views", "Full kitchen", "Bicycles included", "A/C", "WiFi"],
      tag: "HVMI — Homes & Villas by Marriott Bonvoy",
      hvmiCollection: "Vineyards & Winery Homes",
      hvmiCollectionUrl: "homes-and-villas.marriott.com/en/collections",
    },
    {
      provenance: "AMADEUS", name: "Podere Sant'Angelo — Chianti Countryside", stars: 5, price: 620, type: "HVMI_VILLA",
      amenities: ["Private pool", "Working vineyard on property", "Olive grove", "Outdoor dining terrace", "Panoramic valley views"],
      tag: "HVMI — Homes & Villas by Marriott Bonvoy (18km radius expansion)",
      hvmiCollection: "Vineyards & Winery Homes",
      hvmiCollectionUrl: "homes-and-villas.marriott.com/en/collections",
    },
    {
      provenance: "RAPIDAPI", name: "Casa della Pace — Lucca Hills Retreat", stars: 5, price: 395, type: "HVMI_VILLA",
      amenities: ["Zen garden", "Heated pool", "Yoga terrace", "Fully equipped kitchen", "Mountain views", "WiFi"],
      tag: "HVMI — Homes & Villas by Marriott Bonvoy",
      hvmiCollection: "Homes With Zen",
      hvmiCollectionUrl: "homes-and-villas.marriott.com/en/collections",
    },
  ] : [];

  const raw = [
    ...hvmiVillas,
    ...(isLucca ? [
      { provenance: "AMADEUS",      name: "Grand Universe Lucca, Autograph Collection", stars: 5, price: 380, amenities: ["Rooftop terrace", "Restaurant", "Spa", "Horse-carriage rides", "Olive oil tasting", "Mixology classes"], tag: "FALLBACK — Marriott Hotel Brand" },
      { provenance: "RAPIDAPI",     name: "Renaissance Tuscany Il Ciocco Resort & Spa",  stars: 4, price: 290, amenities: ["Spa", "Pool", "Restaurant", "Nature trails", "Tennis"], tag: "FALLBACK — Marriott Hotel Brand" },
    ] : [
      { provenance: "AMADEUS",      name: `Marriott ${city} Downtown`,  stars: 5, price: rand(280, 380), amenities: ["Spa", "Pool", "Gym", "Restaurant"] },
      { provenance: "AMADEUS",      name: `Sheraton ${city} Grand`,      stars: 4, price: rand(180, 260), amenities: ["Pool", "Gym", "Bar"] },
      { provenance: "RAPIDAPI",     name: `W Hotel ${city}`,             stars: 5, price: rand(340, 480), amenities: ["Rooftop Bar", "Spa", "Concierge"] },
      { provenance: "RAPIDAPI",     name: `Westin ${city} City Centre`,  stars: 4, price: rand(200, 300), amenities: ["Gym", "Restaurant", "Business Centre"] },
      { provenance: "ILLUSTRATIVE", name: `Ritz-Carlton ${city}`,        stars: 5, price: rand(600, 950), amenities: ["Michelin Restaurant", "Private Pool", "Butler Service"] },
      { provenance: "AMADEUS",      name: `Courtyard ${city} Midtown`,   stars: 3, price: rand(120, 200), amenities: ["Gym", "Restaurant"] },
    ]),
  ];

  type HotelRaw = { provenance: string; name: string; stars: number; price: number; amenities: string[]; type?: string; tag?: string; hvmiCollection?: string; hvmiCollectionUrl?: string };
  const offers = (raw as HotelRaw[]).map((r, i) => ({
    id: `offer-hotel-${i + 1}-${Date.now()}`,
    provenance: r.provenance,
    bookable: r.provenance !== "ILLUSTRATIVE",
    title: r.name,
    price: `${r.price}.00`,
    currency: "USD",
    rating: parseFloat((rand(38, 50) / 10).toFixed(1)),
    reviews: rand(80, 3200),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    tag: r.tag,
    hvmiCollection: r.hvmiCollection,
    hvmiCollectionUrl: r.hvmiCollectionUrl,
    details: {
      hotelName: r.name,
      accommodationType: r.type ?? "HOTEL",
      starRating: r.stars,
      checkInDate: new Date(Date.now() + 86400000 * 10).toISOString().split("T")[0],
      checkOutDate: new Date(Date.now() + 86400000 * 13).toISOString().split("T")[0],
      roomType: r.type === "HVMI_VILLA" ? "Private Villa" : "Deluxe King",
      amenities: r.amenities,
    },
  }));

  // HVMI-first: always surface HVMI properties above hotel fallbacks, then sort within each tier
  const sortFn = (a: (typeof offers)[0], b: (typeof offers)[0]) => {
    if (sort === "price_desc") return parseFloat(b.price) - parseFloat(a.price);
    if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    return parseFloat(a.price) - parseFloat(b.price);
  };
  const hvmiFirst = offers.filter((o) => (o.tag ?? "").startsWith("HVMI"));
  const rest = offers.filter((o) => !(o.tag ?? "").startsWith("HVMI"));
  return [...hvmiFirst.sort(sortFn), ...rest.sort(sortFn)];
}

function carOffers(q: string, sort: string) {
  const city = q || "London";
  const raw = [
    { provenance: "AMADEUS",   vendor: "Hertz",   model: "Toyota Corolla", carClass: "ECONOMY",  price: rand(35, 55)  },
    { provenance: "RAPIDAPI",  vendor: "Avis",    model: "Ford Mustang",   carClass: "PREMIUM",  price: rand(80, 130) },
    { provenance: "AMADEUS",   vendor: "Budget",  model: "Chevrolet Malibu",carClass: "MIDSIZE",  price: rand(50, 75)  },
    { provenance: "RAPIDAPI",  vendor: "Sixt",    model: "BMW X5",         carClass: "SUV",      price: rand(100, 160) },
  ];

  const offers = raw.map((r, i) => ({
    id: `offer-car-${i + 1}-${Date.now()}`,
    provenance: r.provenance,
    bookable: true,
    title: `${r.vendor} · ${r.model} in ${city}`,
    price: `${r.price}.00`,
    currency: "USD",
    rating: parseFloat((rand(35, 50) / 10).toFixed(1)),
    reviews: rand(40, 900),
    expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    details: {
      vendor: r.vendor,
      model: r.model,
      carClass: r.carClass,
      pickupDate: new Date(Date.now() + 86400000 * 10).toISOString().split("T")[0],
      dropoffDate: new Date(Date.now() + 86400000 * 13).toISOString().split("T")[0],
      pickupLocation: `${city} Airport`,
      unlimited_mileage: true,
    },
  }));

  if (sort === "price_asc" || !sort) offers.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  if (sort === "price_desc") offers.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  return offers;
}

// ─── Search endpoint (frontend calls GET /search?q=...&types=flight&sort=...) ─
const handleSearch = (req: Request, res: Response) => {
  const q    = (req.query["q"]     as string) ?? "";
  const types = (req.query["types"] as string) ?? "flight";
  const sort  = (req.query["sort"]  as string) ?? "price_asc";

  let offers: object[] = [];
  if (types === "flight")      offers = flightOffers(q, sort);
  else if (types === "hotel")  offers = hotelOffers(q, sort);
  else if (types === "car")    offers = carOffers(q, sort);
  else                         offers = flightOffers(q, sort);

  res.json({
    offers,
    supplierStatuses: [
      { supplier: "AMADEUS",      status: "ok",      latencyMs: rand(120, 280) },
      { supplier: "RAPIDAPI",     status: "ok",      latencyMs: rand(80, 200)  },
      { supplier: "ILLUSTRATIVE", status: "degraded", latencyMs: rand(400, 900) },
    ],
    total: offers.length,
    searchedAt: new Date().toISOString(),
  });
};

// Both paths — direct and via API prefix
app.get("/search",            handleSearch);
app.get("/api/v1/search",     handleSearch);
app.get("/api/v1/search/flights", (req: Request, res: Response) => { req.query["types"] = "flight"; handleSearch(req, res); });
app.get("/api/v1/search/hotels",  (req: Request, res: Response) => { req.query["types"] = "hotel";  handleSearch(req, res); });
app.get("/api/v1/search/cars",    (req: Request, res: Response) => { req.query["types"] = "car";    handleSearch(req, res); });

app.listen(PORT, () => {
  console.log(`[search-service] listening on :${PORT}`);
});

export default app;
