"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { trackEvent, JOURNEY_EVENTS } from "../../lib/analytics";

// ─── HVMI Collections data ────────────────────────────────────────────────────

interface HvmiCollection {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  heroImage: string;
  propertyCount: number;
  startingFrom: number;
  currency: string;
  tags: string[];
  featured?: boolean;
  destinations: string[];
}

const HVMI_COLLECTIONS: HvmiCollection[] = [
  {
    id: "col-001",
    slug: "vineyards-winery",
    name: "Vineyards & Winery Homes",
    subtitle: "HVMI Signature Collection",
    description: "Estate homes set among working vineyards where you can harvest grapes, meet the winemakers, and savour private tastings.",
    heroImage: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=900&q=85&fit=crop",
    propertyCount: 34,
    startingFrom: 650,
    currency: "USD",
    tags: ["Wine", "Gourmet", "Italy", "France", "Napa"],
    featured: true,
    destinations: ["Tuscany, Italy", "Provence, France", "Napa Valley, USA", "Rioja, Spain"],
  },
  {
    id: "col-002",
    slug: "zen-wellness",
    name: "Homes With Zen",
    subtitle: "Wellness Retreats",
    description: "Curated sanctuaries designed for deep rest — private yoga pavilions, infinity pools and forested meditation gardens.",
    heroImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=85&fit=crop",
    propertyCount: 22,
    startingFrom: 490,
    currency: "USD",
    tags: ["Wellness", "Yoga", "Spa", "Mindfulness"],
    destinations: ["Bali, Indonesia", "Sedona, USA", "Ibiza, Spain", "Kyoto, Japan"],
  },
  {
    id: "col-003",
    slug: "oceanfront-retreats",
    name: "Oceanfront Retreats",
    subtitle: "Sea & Sky",
    description: "Wake to the sound of waves in cliffside villas, beachfront estates and overwater bungalows.",
    heroImage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=85&fit=crop",
    propertyCount: 58,
    startingFrom: 720,
    currency: "USD",
    tags: ["Beachfront", "Ocean", "Luxury", "Private"],
    featured: true,
    destinations: ["Maldives", "Santorini, Greece", "Amalfi Coast, Italy", "Caribbean"],
  },
  {
    id: "col-004",
    slug: "mountain-chalets",
    name: "Mountain Chalets & Lodges",
    subtitle: "Alpine Escapes",
    description: "Ski-in/ski-out chalets, granite-walled stone lodges and glass-fronted cabins perched above treelines.",
    heroImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85&fit=crop",
    propertyCount: 41,
    startingFrom: 580,
    currency: "USD",
    tags: ["Skiing", "Mountains", "Snow", "Fireplace"],
    destinations: ["Aspen, USA", "Swiss Alps", "French Alps", "Dolomites, Italy"],
  },
  {
    id: "col-005",
    slug: "historic-estates",
    name: "Historic Estates & Castles",
    subtitle: "Living Heritage",
    description: "Centuries-old manor houses, restored castles and noble estates where history is written into every stone.",
    heroImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85&fit=crop",
    propertyCount: 18,
    startingFrom: 890,
    currency: "USD",
    tags: ["Heritage", "History", "Castles", "Unique"],
    featured: true,
    destinations: ["Tuscany, Italy", "Burgundy, France", "Andalusia, Spain", "Cotswolds, UK"],
  },
  {
    id: "col-006",
    slug: "ultra-luxury",
    name: "Ultra Luxury Villas",
    subtitle: "The Pinnacle Collection",
    description: "Staff-attended estates with helipads, private chefs, tennis courts and staff-to-guest ratios that exceed 1:1.",
    heroImage: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=85&fit=crop",
    propertyCount: 12,
    startingFrom: 3500,
    currency: "USD",
    tags: ["Ultra-luxury", "Private staff", "Exclusive"],
    destinations: ["St. Barts", "Monaco", "Mallorca, Spain", "Turks & Caicos"],
  },
  {
    id: "col-007",
    slug: "family-adventure",
    name: "Family Adventure Homes",
    subtitle: "Every Generation",
    description: "Kid-safe pools, games rooms, private sports courts and proximity to world-class family attractions.",
    heroImage: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=900&q=85&fit=crop",
    propertyCount: 47,
    startingFrom: 380,
    currency: "USD",
    tags: ["Family", "Kids", "Games", "Adventures"],
    destinations: ["Orlando, USA", "Disneyland Paris area", "Phuket, Thailand", "Costa Rica"],
  },
  {
    id: "col-008",
    slug: "romantic-hideaways",
    name: "Romantic Hideaways",
    subtitle: "For Two",
    description: "Intimate escapes crafted for couples — private plunge pools, rose-petal turndown service and sunset terraces.",
    heroImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=85&fit=crop",
    propertyCount: 53,
    startingFrom: 420,
    currency: "USD",
    tags: ["Couples", "Romance", "Honeymoon", "Private"],
    featured: true,
    destinations: ["Paris, France", "Santorini, Greece", "Bali, Indonesia", "Maldives"],
  },
];

const CATEGORY_FILTERS = [
  { key: "all",     label: "All Collections" },
  { key: "featured", label: "Featured" },
  { key: "beach",   label: "Beach & Ocean" },
  { key: "mountain", label: "Mountains" },
  { key: "culture", label: "Culture & Heritage" },
  { key: "wellness", label: "Wellness" },
];

type FilterKey = typeof CATEGORY_FILTERS[number]["key"];

function matchesFilter(col: HvmiCollection, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "featured") return col.featured === true;
  if (filter === "beach") return col.tags.some(t => ["Beachfront", "Ocean", "Private", "Couples", "Romance"].includes(t));
  if (filter === "mountain") return col.tags.some(t => ["Mountains", "Snow", "Skiing", "Alpine"].includes(t));
  if (filter === "culture") return col.tags.some(t => ["Heritage", "History", "Castles", "Wine"].includes(t));
  if (filter === "wellness") return col.tags.some(t => ["Wellness", "Yoga", "Spa", "Zen"].includes(t));
  return true;
}

function CollectionCard({ col }: { col: HvmiCollection }) {
  return (
    <Link
      href={`/search?collection=${col.slug}`}
      className="group relative block rounded-2xl overflow-hidden border transition-shadow hover:shadow-xl"
      style={{ background: "var(--voya-surface)", borderColor: "var(--voya-border)" }}
      onClick={() => trackEvent(JOURNEY_EVENTS.OFFER_CTA_CLICKED, { collectionId: col.id, collectionName: col.name })}
    >
      {/* Hero image */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <Image
          src={col.heroImage}
          alt={col.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />

        {col.featured && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "var(--voya-gold)", color: "#000" }}
          >
            ⭐ Featured
          </div>
        )}

        <div className="absolute bottom-3 left-3">
          <span className="text-xs font-medium text-white/80">{col.subtitle}</span>
          <h3 className="text-lg font-bold text-white leading-tight">{col.name}</h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--voya-fg-secondary)" }}>
          {col.description}
        </p>

        {/* Destinations */}
        <div className="flex flex-wrap gap-1 mb-3">
          {col.destinations.slice(0, 3).map(d => (
            <span
              key={d}
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: "var(--voya-surface-alt)", color: "var(--voya-fg-tertiary)", border: "1px solid var(--voya-border)" }}
            >
              📍 {d}
            </span>
          ))}
          {col.destinations.length > 3 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ color: "var(--voya-fg-tertiary)" }}>
              +{col.destinations.length - 3} more
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--voya-border)" }}>
          <div>
            <span className="text-xs" style={{ color: "var(--voya-fg-tertiary)" }}>From </span>
            <span className="text-base font-bold" style={{ color: "var(--voya-fg-primary)" }}>
              ${col.startingFrom.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: "var(--voya-fg-tertiary)" }}> / night</span>
          </div>
          <div className="text-xs" style={{ color: "var(--voya-fg-tertiary)" }}>
            {col.propertyCount} properties
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CollectionsPage(): React.JSX.Element {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [search, setSearch] = React.useState("");

  const displayed = React.useMemo(() => {
    let cols = HVMI_COLLECTIONS.filter(c => matchesFilter(c, filter));
    if (search.trim()) {
      const q = search.toLowerCase();
      cols = cols.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.destinations.some(d => d.toLowerCase().includes(q))
      );
    }
    return cols;
  }, [filter, search]);

  return (
    <div className="min-h-screen" style={{ background: "var(--voya-bg)" }}>
      {/* Hero banner */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: 280, background: "var(--voya-surface-2)", borderBottom: "1px solid var(--voya-border)" }}
      >
        <div className="absolute inset-0 opacity-[0.06]">
          <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=60&fit=crop"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            aria-hidden
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "var(--voya-accent-f1)", color: "var(--voya-accent)", border: "1px solid var(--voya-chip-border)" }}
          >
            ✦ Homes &amp; Villas by Marriott Bonvoy
          </div>
          <h1 className="text-3xl md:text-5xl font-medium mb-4" style={{ color: "var(--voya-text)", fontFamily: "var(--font-serif)" }}>
            Curated Collections
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8" style={{ color: "var(--voya-text-2)" }}>
            Every collection is hand-selected by our HVMI experts. Discover the perfect category of luxury home for your journey.
          </p>

          {/* Search within collections */}
          <div className="mx-auto max-w-md relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: "var(--voya-text-3)" }}>🔍</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search collections, destinations, experiences..."
              className="w-full pl-10 pr-4 py-3 rounded-full text-sm focus:outline-none"
              style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)", color: "var(--voya-text)" }}
              aria-label="Search collections"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{
                background: filter === f.key ? "var(--voya-accent)" : "var(--voya-surface)",
                color: filter === f.key ? "#fff" : "var(--voya-fg-secondary)",
                border: `1px solid ${filter === f.key ? "var(--voya-accent)" : "var(--voya-border)"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm" style={{ color: "var(--voya-fg-secondary)" }}>
            {displayed.length} collection{displayed.length !== 1 ? "s" : ""}{search ? ` matching "${search}"` : ""}
          </p>
        </div>

        {/* Collections grid */}
        {displayed.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--voya-fg-tertiary)" }}>
            <div className="text-5xl mb-3">🏠</div>
            <p className="text-base">No collections match your search.</p>
            <button type="button" onClick={() => { setSearch(""); setFilter("all"); }} className="mt-3 text-sm underline" style={{ color: "var(--voya-accent)" }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map(col => (
              <CollectionCard key={col.id} col={col} />
            ))}
          </div>
        )}

        {/* Bonvoy CTA strip */}
        <div
          className="mt-12 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-5"
          style={{ background: "var(--voya-accent-f1)", border: "1px solid var(--voya-chip-border)" }}
        >
          <div>
            <h2 className="text-xl font-medium mb-1" style={{ color: "var(--voya-text)", fontFamily: "var(--font-serif)" }}>Unlock exclusive member rates</h2>
            <p className="text-sm" style={{ color: "var(--voya-text-2)" }}>
              Sign in to your Marriott Bonvoy account to access member pricing, earn points on every stay, and unlock elite benefits.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/auth/login"
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{ border: "1px solid var(--voya-border)", color: "var(--voya-text-2)" }}
            >
              Sign in
            </Link>
            <Link
              href="/assistant"
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: "var(--voya-accent)", color: "#fff" }}
            >
              Plan with AI →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
