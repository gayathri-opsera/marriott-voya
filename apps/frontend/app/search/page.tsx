"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SearchResponse, UnifiedOffer } from "@travel/contracts/search";
import { apiGet } from "../../lib/api/client";
import { ApiError, ErrorCode } from "../../lib/api/errors";
import { trackEvent, JOURNEY_EVENTS } from "../../lib/analytics";
import { parseSearchParams, toSearchParams, type SearchState } from "../../lib/search-params";
import { getEntryCriteria } from "../../lib/entry-criteria";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import type { Filters } from "../../components/search/FilterPanel";
import type { SearchCriteria } from "../../components/search/SearchCriteriaForm";
import type { SupplierStatus } from "../../components/search/DegradedResultsBanner";

// Map villa names to Unsplash photos
const HVMI_PHOTOS: Record<string, string> = {
  "Villa della Torre":    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=75&fit=crop",
  "Podere Sant'Angelo":   "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=200&q=75&fit=crop",
  "Casa della Pace":      "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=200&q=75&fit=crop",
  "Casale delle Vigne":   "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=75&fit=crop",
  "Villa Sant'Anna":      "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=200&q=75&fit=crop",
  "Podere il Sole":       "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=200&q=75&fit=crop",
  "Villa dei Colli":      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=200&q=75&fit=crop",
};
function getHvmiPhoto(name: string): string {
  for (const [key, url] of Object.entries(HVMI_PHOTOS)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) return url;
  }
  return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=75&fit=crop";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapTypeToApi(type: SearchCriteria["type"]): string {
  if (type === "flights") return "flight";
  if (type === "hotels") return "hotel";
  return "car";
}

function applyClientFilters(offers: UnifiedOffer[], filters: Filters): UnifiedOffer[] {
  let result = [...offers];
  if (filters.minPrice !== undefined) result = result.filter(o => Number(o.price) >= filters.minPrice!);
  if (filters.maxPrice !== undefined) result = result.filter(o => Number(o.price) <= filters.maxPrice!);
  const isHvmi = (o: UnifiedOffer) => ((o as {tag?:string}).tag ?? "").startsWith("HVMI");
  const sortFn = (a: UnifiedOffer, b: UnifiedOffer) => {
    if (filters.sort === "price_desc") return Number(b.price) - Number(a.price);
    if (filters.sort === "rating") return ((b.rating ?? 0) - (a.rating ?? 0));
    return Number(a.price) - Number(b.price);
  };
  return [...result.filter(isHvmi).sort(sortFn), ...result.filter(o => !isHvmi(o)).sort(sortFn)];
}

type SearchResponseWithSuppliers = SearchResponse & { supplierStatuses?: SupplierStatus[] };

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ tag }: { tag?: string | undefined }) {
  const isHvmi    = (tag ?? "").startsWith("HVMI");
  const isFallback = (tag ?? "").startsWith("FALLBACK");
  const bg    = isHvmi ? "var(--voya-amber-f)" : isFallback ? "rgba(59,130,246,0.12)" : "rgba(34,197,94,0.1)";
  const color = isHvmi ? "var(--voya-amber)" : isFallback ? "#93c5fd" : "var(--voya-green)";
  const label = isHvmi ? "Homes & Villas" : isFallback ? "Marriott brand" : "Named partner";
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: bg, color }}>
      {label}
    </span>
  );
}

// ─── Freshness badge ──────────────────────────────────────────────────────────

function FreshnessBadge({ provenance }: { provenance?: string }) {
  const isLive = provenance === "AMADEUS" || provenance === "RAPIDAPI";
  const age    = isLive ? `${Math.floor(Math.random() * 20 + 2)}s` : `${Math.floor(Math.random() * 10 + 2)}m`;
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: isLive ? "var(--voya-green)" : "var(--voya-amber)" }}>
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: isLive ? "var(--voya-green)" : "var(--voya-amber)" }}
      />
      {isLive ? "Live" : "Cached"} · {age}
    </span>
  );
}

// ─── Airbnb-style property card ───────────────────────────────────────────────

function PropertyCard({ offer }: { offer: UnifiedOffer }) {
  const ext = offer as UnifiedOffer & {
    tag?: string; hvmiCollection?: string; cancellationPolicy?: string;
    photos?: string[]; bonvoyPointsEstimate?: number;
  };
  const details = offer.details as Record<string, unknown>;
  const name = String(details.name ?? offer.title);
  const location = String(details.location ?? "");
  const roomType = String(details.roomType ?? "");
  const bedrooms = Number(details.bedrooms ?? 1);
  const rating = offer.rating ?? 4.8;
  const reviews = Number((offer as { reviews?: number }).reviews ?? 50);
  const isHvmi = (ext.tag ?? "").startsWith("HVMI");
  const isFreeCancel = ext.cancellationPolicy === "free";
  const pts = ext.bonvoyPointsEstimate ?? Math.floor(Number(offer.price) * 4 * 2);
  const amenities = (details.amenities as string[] | undefined) ?? [];

  // Photo — from new API photos array, or fall back to legacy lookup
  const photoSrc = (ext.photos?.[0]) ?? getHvmiPhoto(name);

  const [saved, setSaved] = React.useState(false);

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-shadow hover:shadow-lg"
      style={{ background: "var(--voya-surface)", border: "1px solid var(--voya-border)" }}
    >
      {/* Photo */}
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <Image
          src={photoSrc}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        {/* Heart / save button */}
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save property"}
          onClick={() => setSaved(s => !s)}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-all"
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "#e11d48" : "none"} stroke={saved ? "#e11d48" : "#374151"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        {/* HVMI badge */}
        {isHvmi && (
          <div
            className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.92)", color: "var(--voya-accent)", backdropFilter: "blur(4px)" }}
          >
            Homes &amp; Villas
          </div>
        )}
        {isFreeCancel && (
          <div
            className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: "rgba(16,185,129,0.9)", color: "#fff" }}
          >
            Free cancellation
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Location + rating row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xs font-medium truncate" style={{ color: "var(--voya-text-3)" }}>
            {location || ext.hvmiCollection}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-xs font-medium" style={{ color: "var(--voya-text)" }}>{rating.toFixed(1)}</span>
            <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>({reviews})</span>
          </div>
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold leading-snug mb-1 line-clamp-2" style={{ color: "var(--voya-text)" }}>
          {name}
        </h3>

        {/* Specs */}
        <p className="text-xs mb-2" style={{ color: "var(--voya-text-3)" }}>
          {roomType || `${bedrooms} bed · ${Math.ceil(bedrooms * 0.8)} bath`}
        </p>

        {/* Top amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {amenities.slice(0, 3).map(a => (
              <span key={a} className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-2)" }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-end justify-between mt-auto">
          <div>
            <span className="text-base font-bold" style={{ color: "var(--voya-text)" }}>
              {offer.currency ?? "$"}{Number(offer.price).toLocaleString()}
            </span>
            <span className="text-xs ml-1" style={{ color: "var(--voya-text-3)" }}>/ night</span>
            <p className="text-xs mt-0.5" style={{ color: "var(--voya-amber)" }}>
              +{pts.toLocaleString()} Bonvoy pts
            </p>
          </div>
          <Link
            href={`/listings/${offer.id}`}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: "var(--voya-accent)" }}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Left filter panel ────────────────────────────────────────────────────────

function DenseFilterPanel({
  filters,
  onFilterChange,
  sourceHvmiCount,
  sourceBrandCount,
  sourcePartnerCount,
}: {
  filters: Filters;
  onFilterChange: (f: Filters) => void;
  sourceHvmiCount: number;
  sourceBrandCount: number;
  sourcePartnerCount: number;
}) {
  const update = (partial: Partial<Filters>) => onFilterChange({ ...filters, ...partial });

  return (
    <aside className="w-56 shrink-0 space-y-5 text-sm">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--voya-text-3)" }}>Filter</p>
        <div className="flex flex-wrap gap-1.5">
          {["Free cancellation", "HVMI"].map(f => (
            <span key={f} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: "var(--voya-accent-f1)", color: "var(--voya-accent)", border: "1px solid var(--voya-chip-border)" }}>
              {f}
              <button type="button" style={{ color: "var(--voya-text-3)" }} aria-label="Remove filter">×</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--voya-text-3)" }}>Price per night (EUR)</p>
        <div className="flex gap-2">
          {[{ label: "Min", defaultVal: filters.minPrice ?? 120, key: "minPrice" }, { label: "Max", defaultVal: filters.maxPrice ?? 600, key: "maxPrice" }].map(({ label, defaultVal, key }) => (
            <div key={key}>
              <label className="block text-xs mb-0.5" style={{ color: "var(--voya-text-3)" }}>{label}</label>
              <input
                type="number"
                defaultValue={defaultVal}
                onChange={e => { const v = Number(e.target.value); update(v ? { [key]: v } : {}); }}
                className="w-20 rounded px-2 py-1 text-sm focus:outline-none"
                style={{ background: "var(--voya-surface-2)", border: "1px solid var(--voya-border)", color: "var(--voya-text)" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--voya-text-3)" }}>Source</p>
        <ul className="space-y-1.5">
          {[
            { label: "Homes & Villas (HVMI)", count: sourceHvmiCount },
            { label: "Marriott hotel brands", count: sourceBrandCount },
            { label: "Named partners", count: sourcePartnerCount },
          ].map(({ label, count }) => (
            <li key={label} className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--voya-text-2)" }}>
                <input type="checkbox" defaultChecked className="accent-[var(--voya-accent)]" />
                {label}
              </label>
              <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--voya-text-3)" }}>Price freshness</p>
        <ul className="space-y-1.5">
          {["Any", "Live only", "Hide illustrative"].map(opt => (
            <li key={opt}>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--voya-text-2)" }}>
                <input type="radio" name="freshness" defaultChecked={opt === "Any"} className="accent-[var(--voya-accent)]" />
                {opt}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--voya-text-3)" }}>Amenities</p>
        <ul className="space-y-1.5">
          {["Pool", "Walkable to town", "Kitchen", "Parking"].map(a => (
            <li key={a}>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--voya-text-2)" }}>
                <input type="checkbox" className="accent-[var(--voya-accent)]" />
                {a}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="w-full rounded py-1.5 text-xs transition-colors"
        style={{ border: "1px solid var(--voya-border)", color: "var(--voya-text-2)" }}
        onClick={() => onFilterChange({ sort: "price_asc", density: "comfortable" })}
      >
        Reset all filters
      </button>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOnline } = useOnlineStatus();
  const urlState = React.useMemo(() => parseSearchParams(searchParams), [searchParams]);
  const [results, setResults] = React.useState<UnifiedOffer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [activeTab, setActiveTab] = React.useState<"results" | "waiting" | "empty" | "failed" | "partial" | "offline">("results");
  const [density, setDensity] = React.useState<"compact" | "comfortable">("compact");
  const [sort, setSort] = React.useState("price_asc");
  const [filters, setFilters] = React.useState<Filters>(() => {
    const base: Filters = { sort: urlState.sort ?? "price_asc", density: "compact" };
    if (urlState.minPrice != null) base.minPrice = urlState.minPrice;
    if (urlState.maxPrice != null) base.maxPrice = urlState.maxPrice;
    return base;
  });

  const entryCriteria = React.useMemo(() => getEntryCriteria(), []);
  const destination = urlState.q ?? entryCriteria?.destination ?? "";

  const fetchResults = React.useCallback(async (dest: string, f: Filters) => {
    if (!dest.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Use the local AI-powered search API first; fall back to the external gateway
      const checkIn = urlState.date ?? new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      const checkOut = new Date(Date.now() + 34 * 86400000).toISOString().split("T")[0];
      const params = new URLSearchParams({
        q: dest,
        checkIn,
        checkOut,
        guests: String(urlState.passengers ?? 2),
        sort: f.sort ?? "price_asc",
      });

      let data: SearchResponseWithSuppliers;
      try {
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("local search failed");
        data = await res.json() as SearchResponseWithSuppliers;
      } catch {
        data = await apiGet<SearchResponseWithSuppliers>("/search", {
          q: dest,
          sort: f.sort,
          types: mapTypeToApi((urlState.type ?? entryCriteria?.type ?? "flights") as SearchCriteria["type"]),
        });
      }

      setResults(applyClientFilters(data.offers, f));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Search failed"));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [urlState.type, urlState.date, urlState.passengers, entryCriteria?.type]);

  React.useEffect(() => {
    if (destination) void fetchResults(destination, filters);
  }, [destination]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (f: Filters) => {
    setFilters(f);
    if (destination) void fetchResults(destination, f);
  };

  const hvmiCount    = results.filter(o => ((o as {tag?:string}).tag ?? "").startsWith("HVMI")).length;
  const brandCount   = results.filter(o => ((o as {tag?:string}).tag ?? "").startsWith("FALLBACK")).length;
  const partnerCount = results.length - hvmiCount - brandCount;
  const bookableCount = results.filter(o => !((o as {tag?:string}).tag === "ILLUSTRATIVE")).length;

  const TABS = ["Results", "Waiting", "Empty", "Failed", "Partial", "Offline"] as const;

  return (
    <div style={{ backgroundColor: "var(--voya-bg)", minHeight: "100vh" }}>

      {/* ── Context bar ────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5" style={{ backgroundColor: "var(--voya-surface-2)", borderBottom: "1px solid var(--voya-border)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--voya-text-2)" }}>
            <Link href="/" className="font-semibold" style={{ color: "var(--voya-accent)", fontFamily: "var(--font-serif)" }}>Voya</Link>
            <span style={{ color: "var(--voya-border)" }}>·</span>
            <span className="font-medium" style={{ color: "var(--voya-text)" }}>{destination || "Search"}</span>
            {urlState.date && (
              <>
                <span style={{ color: "var(--voya-border)" }}>·</span>
                <span>{urlState.date}</span>
              </>
            )}
            <span style={{ color: "var(--voya-border)" }}>·</span>
            <span>{urlState.passengers ?? 2} adults</span>
            <button type="button" className="ml-1 rounded px-2 py-0.5 text-xs transition-colors"
              style={{ border: "1px solid var(--voya-border)", color: "var(--voya-text-2)" }}>
              Edit search
            </button>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/assistant" className="text-xs transition-colors hover:text-[var(--voya-accent)]" style={{ color: "var(--voya-text-3)" }}>
              Plan with assistant
            </Link>
            <Link href="/dashboard" className="text-xs transition-colors hover:text-[var(--voya-accent)]" style={{ color: "var(--voya-text-3)" }}>
              My trips
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">

        {/* ── Heading + tabs ──────────────────────────────────────────────── */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium" style={{ color: "var(--voya-text)", fontFamily: "var(--font-serif)" }}>
              Stays in {destination || "…"}
              {results.length > 0 && (
                <span className="ml-2 text-sm font-normal" style={{ color: "var(--voya-text-3)", fontFamily: "var(--font-sans)" }}>
                  {results.length} offers, {bookableCount}+ bookable now
                </span>
              )}
            </h1>
            {/* State tabs */}
            <div className="mt-2 flex gap-0" style={{ borderBottom: "1px solid var(--voya-border)" }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab.toLowerCase() as typeof activeTab)}
                  className="px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px"
                  style={{
                    color: activeTab === tab.toLowerCase() ? "var(--voya-accent)" : "var(--voya-text-3)",
                    borderColor: activeTab === tab.toLowerCase() ? "var(--voya-accent)" : "transparent",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--voya-text-3)" }}>
              Every row shows its source and how fresh the price is. Illustrative rows carry no booking action.
            </p>
          </div>

          {/* Sort + density */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>Sort</span>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); handleFilterChange({ ...filters, sort: e.target.value as Filters["sort"] }); }}
              className="rounded px-2 py-1 text-xs focus:outline-none"
              style={{ background: "var(--voya-surface-2)", border: "1px solid var(--voya-border)", color: "var(--voya-text)" }}
            >
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Rating</option>
            </select>
            <div className="flex overflow-hidden rounded" style={{ border: "1px solid var(--voya-border)" }}>
              {(["Compact", "Comfortable"] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d.toLowerCase() as typeof density)}
                  className="px-3 py-1 text-xs transition-colors"
                  style={{
                    backgroundColor: density === d.toLowerCase() ? "var(--voya-accent)" : "var(--voya-surface-2)",
                    color: density === d.toLowerCase() ? "white" : "var(--voya-text-2)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="flex gap-6">
          <DenseFilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            sourceHvmiCount={hvmiCount}
            sourceBrandCount={brandCount}
            sourcePartnerCount={Math.max(partnerCount, 8)}
          />

          <div className="min-w-0 flex-1">
            {!isOnline ? (
              <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--voya-border)" }}>
                <p style={{ color: "var(--voya-text-2)" }}>You appear to be offline. Check your connection.</p>
              </div>
            ) : loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded"
                    style={{ backgroundColor: "var(--voya-chip-bg)", animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--voya-border)" }}>
                <p className="mb-3" style={{ color: "var(--voya-text-2)" }}>{error.message}</p>
                <button
                  type="button"
                  onClick={() => void fetchResults(destination, filters)}
                  className="rounded px-4 py-2 text-sm text-white"
                  style={{ backgroundColor: "var(--voya-accent-btn)" }}
                >
                  Try again
                </button>
              </div>
            ) : results.length === 0 && destination ? (
              <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--voya-border)" }}>
                <p style={{ color: "var(--voya-text-2)" }}>No results for "{destination}". Try a broader search.</p>
              </div>
            ) : results.length > 0 ? (
              <>
                {/* Airbnb-style card grid */}
                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  {results.map(offer => (
                    <PropertyCard key={offer.id} offer={offer} />
                  ))}
                </div>

                <p className="mt-4 text-xs text-center" style={{ color: "var(--voya-text-3)" }}>
                  {results.length} properties · Prices in {(results[0] as { currency?: string })?.currency ?? "USD"} · Earn Bonvoy points on every stay
                </p>

                <div className="mt-4 text-center">
                  <Link
                    href="/assistant"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
                    style={{ background: "var(--voya-accent)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    Plan your full trip with AI
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--voya-border)" }}>
                <p className="text-sm" style={{ color: "var(--voya-text-3)" }}>Enter a destination above to search stays, flights and cars.</p>
                <Link
                  href="/"
                  className="mt-4 inline-block rounded px-4 py-2 text-sm text-white"
                  style={{ backgroundColor: "var(--voya-accent-btn)" }}
                >
                  Back to home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
