"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent } from "../../lib/analytics";

const VILLAS = [
  {
    id: "v1",
    name: "Casale delle Vigne",
    location: "Lucca Historic Centre, Tuscany",
    price: 420,
    priceTotal: 2940,
    nights: 7,
    rating: "4.9",
    reviews: 87,
    collection: "Vineyards & Winery Homes",
    beds: 3,
    baths: 2,
    guests: 6,
    amenities: ["Private pool", "Vineyard terrace", "Full kitchen", "A/C", "Bicycles"],
    description: "A beautifully restored stone farmhouse nestled among olive groves and vines, just 400m from the Renaissance city walls. The private pool overlooks the Tuscan countryside.",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85&fit=crop",
    imgAlt: "Casale delle Vigne villa with pool",
    thumbs: [
      "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80&fit=crop",
      "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80&fit=crop",
    ],
    bonvoyNote: "Points eligibility: confirm current HVMI loyalty terms at booking",
    hvmiUrl: "https://homes-and-villas.marriott.com/en/search/lucca-home-and-villa-rental",
  },
  {
    id: "v2",
    name: "Villa Sant'Anna",
    location: "Near Lucca, Tuscany",
    price: 365,
    priceTotal: 2555,
    nights: 7,
    rating: "4.8",
    reviews: 124,
    collection: "Homes With Zen",
    beds: 2,
    baths: 2,
    guests: 4,
    amenities: ["Zen garden", "Heated pool", "Yoga terrace", "Mountain views", "WiFi"],
    description: "A tranquil hillside retreat with panoramic Apennine views, designed around quiet and contemplation. The zen garden and yoga terrace make this perfect for a restorative stay.",
    img: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&q=85&fit=crop",
    imgAlt: "Villa Sant'Anna with mountain views",
    thumbs: [
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80&fit=crop",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80&fit=crop",
    ],
    bonvoyNote: "Points eligibility: confirm current HVMI loyalty terms at booking",
    hvmiUrl: "https://homes-and-villas.marriott.com/en/search/lucca-home-and-villa-rental",
  },
  {
    id: "v3",
    name: "Podere il Sole",
    location: "Lucca Countryside",
    price: 510,
    priceTotal: 3570,
    nights: 7,
    rating: "5.0",
    reviews: 56,
    collection: "Vineyards & Winery Homes",
    beds: 4,
    baths: 3,
    guests: 8,
    amenities: ["Working vineyard", "Private pool", "Outdoor dining terrace", "Panoramic views", "WiFi", "BBQ"],
    description: "Set on a working 12-hectare wine estate, Podere il Sole offers complete privacy and immersion in Tuscan viticulture. Harvest the olives, tour the cellar, dine alfresco on the terrace.",
    img: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=1200&q=85&fit=crop",
    imgAlt: "Podere il Sole vineyard property",
    thumbs: [
      "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80&fit=crop",
      "https://images.unsplash.com/photo-1511174271151-bb1b7b6dafe7?w=400&q=80&fit=crop",
    ],
    bonvoyNote: "Points eligibility: confirm current HVMI loyalty terms at booking",
    hvmiUrl: "https://homes-and-villas.marriott.com/en/search/lucca-home-and-villa-rental",
  },
  {
    id: "v4",
    name: "Villa dei Colli",
    location: "Bagni di Lucca, Tuscany",
    price: 340,
    priceTotal: 2380,
    nights: 7,
    rating: "4.7",
    reviews: 203,
    collection: "Rentals with Epic Pools",
    beds: 3,
    baths: 2,
    guests: 6,
    amenities: ["Epic infinity pool", "Outdoor kitchen", "Mountain location", "Hiking trails", "WiFi"],
    description: "Perched above the thermal springs of Bagni di Lucca, this classic villa boasts an infinity pool that appears to float above the valley. Ideal for hikers who want comfort at day's end.",
    img: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=85&fit=crop",
    imgAlt: "Villa dei Colli infinity pool",
    thumbs: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80&fit=crop",
      "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80&fit=crop",
    ],
    bonvoyNote: "Points eligibility: confirm current HVMI loyalty terms at booking",
    hvmiUrl: "https://homes-and-villas.marriott.com/en/search/lucca-home-and-villa-rental",
  },
];

const ACTIVITIES = [
  { icon: "🚶", label: "Lucca City Walls Walk", tag: "Free", points: 0, price: 0 },
  { icon: "🍷", label: "Chianti Vineyard Tour", tag: "Bonvoy Tours", points: 1450, price: 145 },
  { icon: "🏛️", label: "Historic Centre Walking Tour", tag: "Bonvoy Tours", points: 850, price: 85 },
  { icon: "🌊", label: "Cinque Terre Day Trip", tag: "Bonvoy Tours", points: 1350, price: 135 },
  { icon: "🎨", label: "Florence + Chianti Day Trip", tag: "Bonvoy Tours", points: 1200, price: 120 },
];

export default function BrowsePage() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [checkIn, setCheckIn]   = React.useState("2026-09-12");
  const [checkOut, setCheckOut] = React.useState("2026-09-19");
  const [guests, setGuests]     = React.useState(2);
  const [sortBy, setSortBy]     = React.useState<"price" | "rating">("price");

  const sorted = [...VILLAS].sort((a, b) =>
    sortBy === "price" ? a.price - b.price : Number(b.rating) - Number(a.rating)
  );

  const selectedVilla = VILLAS.find(v => v.id === selected);

  const handleReserve = (villa: typeof VILLAS[0]) => {
    trackEvent("BROWSE_RESERVE_CLICK", { villaId: villa.id });
    router.push(`/checkout?offerId=${villa.id}&villaName=${encodeURIComponent(villa.name)}&price=${villa.price}`);
  };

  return (
    <div style={{ background: "var(--voya-bg)", minHeight: "100vh", color: "var(--voya-text)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--voya-accent-f1)", background: "var(--voya-bg)" }} className="sticky top-0 z-20 px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          <Link href="/" className="text-sm hover:underline" style={{ color: "var(--voya-accent)" }}>← Home</Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold" style={{ color: "var(--voya-text)" }}>
              HVMI Villas — Lucca &amp; Tuscany
            </h1>
            <p className="text-xs" style={{ color: "var(--voya-text-3)" }}>
              {VILLAS.length} properties · Homes &amp; Villas by Marriott Bonvoy
            </p>
          </div>
          {/* Date strip */}
          <div className="hidden items-center gap-3 sm:flex">
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
              style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-accent-f2)", color: "var(--voya-text)", borderRadius: 8, colorScheme: "dark" }}
              className="px-3 py-1.5 text-xs focus:outline-none" />
            <span style={{ color: "var(--voya-text-4)" }}>→</span>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
              style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-accent-f2)", color: "var(--voya-text)", borderRadius: 8, colorScheme: "dark" }}
              className="px-3 py-1.5 text-xs focus:outline-none" />
            <select value={guests} onChange={e => setGuests(Number(e.target.value))}
              style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-accent-f2)", color: "var(--voya-text)", borderRadius: 8 }}
              className="px-3 py-1.5 text-xs focus:outline-none">
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} guest{n !== 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {(["price","rating"] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                style={{ borderRadius: 8, background: sortBy === s ? "var(--voya-accent-f2)" : "transparent", border: "1px solid var(--voya-accent-f2)" }}
                className="px-3 py-1.5 text-xs capitalize transition-colors hover:bg-[var(--voya-accent-f1)]"
              >
                <span style={{ color: sortBy === s ? "#b5abfc" : "#75798c" }}>Sort: {s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Villa grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {sorted.map(villa => (
            <div key={villa.id}
              style={{ background: "var(--voya-surface)", border: `1px solid ${selected === villa.id ? "#9184d9" : "var(--voya-accent-f1)"}`, borderRadius: 14, overflow: "hidden" }}
              className="group"
            >
              {/* Hero photo */}
              <div style={{ position: "relative", height: 240 }}>
                <Image src={villa.img} alt={villa.imgAlt} fill sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, var(--voya-photo-scrim) 100%)" }} />
                {/* Badges */}
                <div style={{ position: "absolute", top: 12, left: 12 }}>
                  <span style={{ background: "var(--voya-photo-scrim)", backdropFilter: "blur(8px)", color: "var(--voya-accent-lt)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500 }}>
                    Homes &amp; Villas
                  </span>
                </div>
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <span style={{ background: "var(--voya-photo-scrim)", backdropFilter: "blur(8px)", color: "var(--voya-amber)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500 }}>
                    ★ {villa.rating} ({villa.reviews})
                  </span>
                </div>
                {/* Bottom info */}
                <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                  <p style={{ color: "var(--voya-accent-dk)", fontSize: 11, marginBottom: 2 }}>{villa.collection}</p>
                  <p style={{ color: "var(--voya-text)", fontSize: 16, fontWeight: 600 }}>{villa.name}</p>
                  <p style={{ color: "var(--voya-text-2)", fontSize: 12 }}>📍 {villa.location}</p>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 px-4 pt-3">
                {villa.thumbs.map((t, i) => (
                  <div key={i} style={{ position: "relative", width: 64, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                    <Image src={t} alt={`${villa.name} photo ${i+2}`} fill className="object-cover" unoptimized />
                  </div>
                ))}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <p style={{ color: "var(--voya-text)", fontSize: 18, fontWeight: 700 }}>
                    ${villa.price}<span style={{ color: "var(--voya-text-3)", fontSize: 12, fontWeight: 400 }}>/night</span>
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="px-4 py-3">
                <div className="flex gap-4 mb-2">
                  <span style={{ color: "var(--voya-text-2)", fontSize: 12 }}>🛏 {villa.beds} bed</span>
                  <span style={{ color: "var(--voya-text-2)", fontSize: 12 }}>🚿 {villa.baths} bath</span>
                  <span style={{ color: "var(--voya-text-2)", fontSize: 12 }}>👥 up to {villa.guests}</span>
                </div>
                <p style={{ color: "var(--voya-text-3)", fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{villa.description}</p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {villa.amenities.map(a => (
                    <span key={a} style={{ background: "var(--voya-accent-f1)", border: "1px solid var(--voya-accent-f2)", color: "var(--voya-accent)", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>
                      {a}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSelected(selected === villa.id ? null : villa.id)}
                    style={{ flex: 1, background: "var(--voya-accent-f1)", border: "1px solid var(--voya-border)", borderRadius: 8 }}
                    className="py-2.5 text-sm font-medium transition-colors hover:bg-[var(--voya-accent-f2)]"
                  >
                    <span style={{ color: "var(--voya-accent-lt)" }}>{selected === villa.id ? "Hide details" : "View details"}</span>
                  </button>
                  <button onClick={() => handleReserve(villa)}
                    style={{ flex: 2, background: "#9184d9", borderRadius: 8 }}
                    className="py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Reserve — ${villa.priceTotal.toLocaleString()} total
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected villa detail pane */}
        {selectedVilla && (
          <div style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)", borderRadius: 14, marginTop: 24 }} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--voya-text)" }}>{selectedVilla.name}</h2>
                <p className="text-sm" style={{ color: "var(--voya-accent)" }}>{selectedVilla.collection}</p>
              </div>
              <a href={selectedVilla.hvmiUrl} target="_blank" rel="noreferrer"
                style={{ color: "var(--voya-accent)", fontSize: 12 }} className="hover:underline">
                View on homes-and-villas.marriott.com ↗
              </a>
            </div>
            <p className="text-xs mb-4 p-3 rounded-lg" style={{ background: "var(--voya-amber-f)", color: "var(--voya-amber)", border: "1px solid rgba(251,191,36,0.2)" }}>
              ⚑ {selectedVilla.bonvoyNote}
            </p>

            {/* Nearby activities */}
            <p className="text-sm font-medium mb-3" style={{ color: "var(--voya-text)" }}>Bookable activities from this villa (Bonvoy Tours &amp; Activities)</p>
            <div className="space-y-2">
              {ACTIVITIES.map(a => (
                <div key={a.label} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid rgba(145,132,217,0.08)" }}>
                  <span className="text-lg">{a.icon}</span>
                  <span className="flex-1 text-sm" style={{ color: "var(--voya-text-2)" }}>{a.label}</span>
                  <span style={{
                    background: a.tag === "Free" ? "rgba(34,197,94,0.12)" : "var(--voya-accent-f1)",
                    color: a.tag === "Free" ? "#4ade80" : "#9a8fe0",
                    borderRadius: 10, padding: "1px 8px", fontSize: 11
                  }}>{a.tag}</span>
                  {a.price > 0 && <span style={{ color: "var(--voya-text)", fontSize: 13, fontWeight: 600, minWidth: 50, textAlign: "right" }}>${a.price}pp</span>}
                  {a.points > 0 && <span style={{ color: "var(--voya-amber)", fontSize: 11 }}>+{a.points.toLocaleString()} pts</span>}
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <Link href="/assistant"
                style={{ background: "var(--voya-accent-f1)", border: "1px solid var(--voya-border)", borderRadius: 8 }}
                className="flex-1 py-2.5 text-sm font-medium text-center transition-colors hover:bg-[var(--voya-accent-f2)]"
              >
                <span style={{ color: "var(--voya-accent-lt)" }}>◎ Plan full itinerary with AI</span>
              </Link>
              <button onClick={() => handleReserve(selectedVilla)}
                style={{ flex: 2, background: "#9184d9", borderRadius: 8 }}
                className="py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Reserve {selectedVilla.name} →
              </button>
            </div>
          </div>
        )}

        {/* Hero destination photo */}
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginTop: 32, height: 300 }}>
          <Image
            src="https://images.unsplash.com/photo-1511174271151-bb1b7b6dafe7?w=1400&q=85&fit=crop"
            alt="Lucca, Tuscany landscape"
            fill
            className="object-cover"
            unoptimized
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, var(--voya-photo-scrim) 40%, transparent)" }} />
          <div style={{ position: "absolute", left: 32, top: "50%", transform: "translateY(-50%)" }}>
            <p className="text-xs mb-1 font-medium" style={{ color: "var(--voya-accent)" }}>Lucca, Tuscany · Italy</p>
            <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--voya-text)" }}>Plan your entire stay with AI</h3>
            <p className="text-sm mb-4 max-w-xs" style={{ color: "var(--voya-text-2)" }}>Villas, activities, Bonvoy tours, flights — assembled automatically.</p>
            <Link href="/assistant"
              style={{ background: "#9184d9", borderRadius: 8 }}
              className="inline-block px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Start with AI →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
