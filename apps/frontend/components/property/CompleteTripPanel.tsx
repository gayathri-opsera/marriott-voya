"use client";

import * as React from "react";
import Image from "next/image";

export interface TripSuggestion {
  id: string;
  type: "activity" | "restaurant" | "transport" | "tour" | "attraction";
  title: string;
  description: string;
  price?: number;
  currency?: string;
  imageUrl: string;
  rating?: number;
  duration?: string;
  distance?: string;
  tags?: string[];
  bookUrl?: string;
}

export interface CompleteTripPanelProps {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  onAddToItinerary?: (suggestion: TripSuggestion) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<TripSuggestion["type"], string> = {
  activity: "🧗",
  restaurant: "🍽",
  transport: "🚗",
  tour: "🗺",
  attraction: "🏛",
};

const SUGGESTION_FILTERS = [
  { key: "all",        label: "All" },
  { key: "attraction", label: "Attractions" },
  { key: "activity",   label: "Activities" },
  { key: "restaurant", label: "Restaurants" },
  { key: "tour",       label: "Tours" },
  { key: "transport",  label: "Transport" },
] as const;

type FilterKey = typeof SUGGESTION_FILTERS[number]["key"];

// Demo suggestions — in production, fetched from AI/activities service
const DEMO_SUGGESTIONS: TripSuggestion[] = [
  {
    id: "sug-001",
    type: "attraction",
    title: "Lucca City Walls Walk",
    description: "Stroll or cycle the Renaissance-era walls encircling the historic center. Stunning views over the rooftops.",
    price: 0,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75&fit=crop",
    rating: 4.8,
    duration: "1–2 hours",
    distance: "8 km",
    tags: ["Free", "Outdoor", "Family"],
  },
  {
    id: "sug-002",
    type: "tour",
    title: "Chianti Wine Tour & Vineyard Visit",
    description: "Private guided tour through the Chianti wine region with tastings at three estates and a gourmet lunch.",
    price: 149,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&q=75&fit=crop",
    rating: 4.9,
    duration: "Full day",
    distance: "40 km",
    tags: ["Wine", "Gourmet", "Private"],
  },
  {
    id: "sug-003",
    type: "activity",
    title: "Truffle Hunting Experience",
    description: "Hunt for prized truffles with an expert local guide and his trained dogs in the Tuscan hills. Cook and taste your finds.",
    price: 120,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&q=75&fit=crop",
    rating: 5.0,
    duration: "Half day",
    distance: "15 km",
    tags: ["Unique", "Culinary", "Outdoors"],
  },
  {
    id: "sug-004",
    type: "restaurant",
    title: "Ristorante Buca di Sant'Antonio",
    description: "Lucca's most celebrated restaurant, serving traditional Lucchese dishes since 1782. Reserve in advance.",
    price: 65,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75&fit=crop",
    rating: 4.7,
    distance: "8 km",
    tags: ["Fine dining", "Historic", "Tuscan"],
  },
  {
    id: "sug-005",
    type: "activity",
    title: "Cooking Class in a Farmhouse",
    description: "Learn to make fresh pasta, ribollita, and cantucci with a local nonna in a traditional Tuscan farmhouse.",
    price: 95,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=75&fit=crop",
    rating: 4.9,
    duration: "3 hours",
    distance: "5 km",
    tags: ["Cooking", "Cultural", "Family"],
  },
  {
    id: "sug-006",
    type: "transport",
    title: "Private Airport Transfer",
    description: "Comfortable, door-to-door private transfer from Pisa International Airport to your villa.",
    price: 85,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=75&fit=crop",
    rating: 4.8,
    duration: "45 min",
    distance: "35 km",
    tags: ["Transfer", "Private", "Door-to-door"],
  },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-xs" style={{ color: i < Math.round(value) ? "var(--voya-gold)" : "var(--voya-fg-tertiary)" }}>★</span>
      ))}
      <span className="ml-1 text-xs" style={{ color: "var(--voya-fg-secondary)" }}>{value.toFixed(1)}</span>
    </span>
  );
}

export function CompleteTripPanel({ destination, checkIn, checkOut, onAddToItinerary, className = "" }: CompleteTripPanelProps) {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [added, setAdded] = React.useState<Set<string>>(new Set());
  const [expanded, setExpanded] = React.useState(true);

  const filtered = React.useMemo(() =>
    filter === "all" ? DEMO_SUGGESTIONS : DEMO_SUGGESTIONS.filter(s => s.type === filter),
    [filter],
  );

  function handleAdd(s: TripSuggestion) {
    setAdded(prev => new Set(prev).add(s.id));
    onAddToItinerary?.(s);
  }

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{ background: "var(--voya-surface)", borderColor: "var(--voya-border)" }}
    >
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ background: "color-mix(in srgb, var(--voya-gold) 20%, transparent)" }}
            aria-hidden
          >
            ✨
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold" style={{ color: "var(--voya-fg-primary)" }}>
              Complete your trip
            </h2>
            <p className="text-xs" style={{ color: "var(--voya-fg-secondary)" }}>
              AI-recommended experiences near {destination}
            </p>
          </div>
        </div>
        <span className="text-lg transition-transform" style={{ color: "var(--voya-fg-secondary)", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
          ›
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {/* AI insight strip */}
          <div
            className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl text-sm"
            style={{ background: "color-mix(in srgb, var(--voya-gold) 8%, transparent)", borderLeft: "3px solid var(--voya-gold)" }}
          >
            <span className="text-base flex-shrink-0">🤖</span>
            <p style={{ color: "var(--voya-fg-secondary)" }}>
              Based on guests who stayed at this villa, we recommend these curated experiences.
              {checkIn && checkOut && ` Matched to your dates: ${checkIn} – ${checkOut}.`}
            </p>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
            {SUGGESTION_FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: filter === f.key ? "var(--voya-gold)" : "var(--voya-surface-alt)",
                  color: filter === f.key ? "#000" : "var(--voya-fg-secondary)",
                  border: `1px solid ${filter === f.key ? "var(--voya-gold)" : "var(--voya-border)"}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Suggestion cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <div
                key={s.id}
                className="rounded-xl overflow-hidden border flex flex-col"
                style={{ background: "var(--voya-surface-alt)", borderColor: "var(--voya-border)" }}
              >
                <div className="relative h-36 flex-shrink-0">
                  <Image src={s.imageUrl} alt={s.title} fill sizes="300px" className="object-cover" />
                  <div
                    className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}
                  >
                    <span>{CATEGORY_ICONS[s.type]}</span>
                    <span className="capitalize">{s.type}</span>
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold mb-1 line-clamp-1" style={{ color: "var(--voya-fg-primary)" }}>{s.title}</h3>
                  {s.rating && <Stars value={s.rating} />}
                  <p className="text-xs mt-1.5 line-clamp-2 flex-1" style={{ color: "var(--voya-fg-secondary)" }}>{s.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--voya-fg-tertiary)" }}>
                    {s.duration && <span>⏱ {s.duration}</span>}
                    {s.distance && <span>📍 {s.distance}</span>}
                  </div>
                  {s.tags && s.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--voya-surface)", color: "var(--voya-fg-tertiary)", border: "1px solid var(--voya-border)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t" style={{ borderColor: "var(--voya-border)" }}>
                    <div>
                      {s.price !== undefined && (
                        <span className="text-sm font-semibold" style={{ color: "var(--voya-fg-primary)" }}>
                          {s.price === 0 ? "Free" : `From $${s.price}`}
                        </span>
                      )}
                      <span className="text-xs ml-1" style={{ color: "var(--voya-fg-tertiary)" }}>/ person</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(s)}
                      disabled={added.has(s.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: added.has(s.id) ? "color-mix(in srgb, var(--voya-gold) 20%, transparent)" : "var(--voya-gold)",
                        color: added.has(s.id) ? "var(--voya-gold)" : "#000",
                      }}
                      aria-label={added.has(s.id) ? "Added to itinerary" : `Add ${s.title} to itinerary`}
                    >
                      {added.has(s.id) ? "✓ Added" : "+ Add"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom prompt */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--voya-border)" }}>
            <p className="text-xs" style={{ color: "var(--voya-fg-tertiary)" }}>
              Powered by Marriott Bonvoy AI · {filtered.length} experiences shown
            </p>
            <a
              href="/plan"
              className="text-xs font-medium underline"
              style={{ color: "var(--voya-gold)" }}
            >
              Build full itinerary →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
