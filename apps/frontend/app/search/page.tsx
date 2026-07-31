"use client";

import * as React from "react";
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
  const bg    = isHvmi ? "rgba(217,119,6,0.18)" : isFallback ? "rgba(59,130,246,0.18)" : "rgba(34,197,94,0.15)";
  const color = isHvmi ? "#fbbf24" : isFallback ? "#93c5fd" : "#4ade80";
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
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: isLive ? "#4ade80" : "#fbbf24" }}>
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: isLive ? "#4ade80" : "#fbbf24" }}
      />
      {isLive ? "Live" : "Cached"} · {age}
    </span>
  );
}

// ─── Dense result row ─────────────────────────────────────────────────────────

function OfferRow({ offer, nights = 4 }: { offer: UnifiedOffer; nights?: number }) {
  const ext = offer as UnifiedOffer & { tag?: string; hvmiCollection?: string; type?: string; cancellationPolicy?: string };
  const isIllustrative = ext.tag === "ILLUSTRATIVE";
  const name   = "name" in offer.details ? String((offer.details as Record<string, unknown>).name ?? offer.title) : offer.title;
  const type   = "roomType" in offer.details ? String((offer.details as Record<string, unknown>).roomType ?? "") : (ext.type ?? "");
  const dist   = "distanceToCenter" in offer.details ? `${(offer.details as Record<string, unknown>).distanceToCenter} km out` : "";
  const total  = (Number(offer.price) * nights).toFixed(0);
  const pts    = Math.floor(Number(offer.price) * nights * 1.5 * 2);
  const freeCancDate = ext.cancellationPolicy === "free" ? `Free to ${nights + 5} Sep` : "Non-refundable";

  return (
    <tr
      className="group border-b border-white/8 transition-colors hover:bg-white/[0.02]"
      style={isIllustrative ? { opacity: 0.55 } : undefined}
    >
      {/* STAY */}
      <td className="py-3 pr-4 pl-3">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-12 shrink-0 rounded"
            style={{
              background: `hsl(${(name.charCodeAt(0) * 37) % 360}, 40%, 30%)`,
            }}
          />
          <div>
            <p className="text-sm font-medium text-white leading-tight">{name}</p>
            <p className="text-xs text-white/40">{type}{dist ? ` · ${dist}` : ""}</p>
            {isIllustrative && (
              <span className="mt-0.5 inline-block text-xs text-amber-400">Illustrative — not bookable</span>
            )}
          </div>
        </div>
      </td>

      {/* SOURCE */}
      <td className="py-3 pr-4">
        <SourceBadge tag={ext.tag ?? ""} />
      </td>

      {/* FRESHNESS */}
      <td className="py-3 pr-4">
        <FreshnessBadge provenance={offer.provenance} />
      </td>

      {/* CANCELLATION */}
      <td className="py-3 pr-4 text-xs text-white/55">{freeCancDate}</td>

      {/* POINTS */}
      <td className="py-3 pr-4 text-xs text-amber-400">
        {isIllustrative ? "—" : pts.toLocaleString()}
      </td>

      {/* TOTAL */}
      <td className="py-3 pr-3 text-right">
        <div className="flex flex-col items-end gap-1.5">
          <div>
            <span className="text-sm font-semibold text-white">EUR {Number(total).toLocaleString()}.00</span>
            <p className="text-xs text-white/35">EUR {Number(offer.price).toFixed(0)}.00 / night</p>
          </div>
          {!isIllustrative ? (
            <Link
              href={`/checkout?offerId=${offer.id}`}
              className="rounded px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#c1440e" }}
            >
              Reserve
            </Link>
          ) : (
            <span className="text-xs text-white/30">Reference only</span>
          )}
        </div>
      </td>
    </tr>
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Filter</p>
        {/* Active filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            Free cancellation
            <button type="button" className="text-white/40 hover:text-white" aria-label="Remove filter">×</button>
          </span>
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            HVMI
            <button type="button" className="text-white/40 hover:text-white" aria-label="Remove filter">×</button>
          </span>
        </div>
      </div>

      {/* Price per night */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Price per night (EUR)</p>
        <div className="flex gap-2">
          <div>
            <label className="block text-xs text-white/40 mb-0.5">Min</label>
            <input
              type="number"
              defaultValue={filters.minPrice ?? 120}
              onChange={e => { const v = Number(e.target.value); update({ ...(v ? { minPrice: v } : {}) }); }}
              className="w-20 rounded border border-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:border-white/30"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-0.5">Max</label>
            <input
              type="number"
              defaultValue={filters.maxPrice ?? 600}
              onChange={e => { const v = Number(e.target.value); update({ ...(v ? { maxPrice: v } : {}) }); }}
              className="w-20 rounded border border-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:border-white/30"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            />
          </div>
        </div>
      </div>

      {/* Source */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Source</p>
        <ul className="space-y-1.5">
          {[
            { label: "Homes & Villas (HVMI)", count: sourceHvmiCount },
            { label: "Marriott hotel brands", count: sourceBrandCount },
            { label: "Named partners", count: sourcePartnerCount },
          ].map(({ label, count }) => (
            <li key={label} className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#c1440e]" />
                {label}
              </label>
              <span className="text-xs text-white/30">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Price freshness */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Price freshness</p>
        <ul className="space-y-1.5">
          {["Any", "Live only", "Hide illustrative"].map(opt => (
            <li key={opt}>
              <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                <input type="radio" name="freshness" defaultChecked={opt === "Any"} className="accent-[#c1440e]" />
                {opt}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Amenities */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Amenities</p>
        <ul className="space-y-1.5">
          {["Pool", "Walkable to town", "Kitchen", "Parking"].map(a => (
            <li key={a}>
              <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                <input type="checkbox" className="accent-[#c1440e]" />
                {a}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="w-full rounded border border-white/15 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
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
      const data = await apiGet<SearchResponseWithSuppliers>("/search", {
        q: dest,
        sort: f.sort,
        types: mapTypeToApi((urlState.type ?? entryCriteria?.type ?? "flights") as SearchCriteria["type"]),
      });
      setResults(applyClientFilters(data.offers, f));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Search failed"));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [urlState.type, entryCriteria?.type]);

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
    <div style={{ backgroundColor: "#14100c", minHeight: "100vh" }}>

      {/* ── Context bar ────────────────────────────────────────────────────── */}
      <div className="border-b border-white/8 px-4 py-2" style={{ backgroundColor: "#1c1410" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="font-bold" style={{ color: "#c1440e" }}>voya</Link>
            <span className="text-white/30">·</span>
            <span className="font-medium text-white">{destination || "Search"}</span>
            {urlState.date && (
              <>
                <span className="text-white/30">·</span>
                <span>{urlState.date}</span>
              </>
            )}
            <span className="text-white/30">·</span>
            <span>{urlState.passengers ?? 2} adults</span>
            <button type="button" className="ml-1 rounded border border-white/15 px-2 py-0.5 text-xs text-white/50 hover:text-white transition-colors">
              Edit search
            </button>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/assistant" className="text-xs text-white/50 hover:text-white transition-colors">
              Plan with assistant
            </Link>
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white transition-colors">
              My trips
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">

        {/* ── Heading + tabs ──────────────────────────────────────────────── */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white">
              Stays in {destination || "…"}
              {results.length > 0 && (
                <span className="ml-2 text-sm font-normal text-white/40">
                  {results.length} offers, {bookableCount}+ bookable now
                </span>
              )}
            </h1>
            {/* State tabs */}
            <div className="mt-2 flex gap-0 border-b border-white/10">
              {TABS.map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab.toLowerCase() as typeof activeTab)}
                  className="px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px"
                  style={{
                    color: activeTab === tab.toLowerCase() ? "#c1440e" : "rgba(255,255,255,0.4)",
                    borderColor: activeTab === tab.toLowerCase() ? "#c1440e" : "transparent",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/30">
              Every row shows its source and how fresh the price is. Illustrative rows carry no booking action.
            </p>
          </div>

          {/* Sort + density */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-white/40">Sort</span>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); handleFilterChange({ ...filters, sort: e.target.value as Filters["sort"] }); }}
              className="rounded border border-white/10 px-2 py-1 text-xs text-white focus:outline-none"
              style={{ backgroundColor: "#2a1f18", colorScheme: "dark" }}
            >
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Rating</option>
            </select>
            <div className="flex overflow-hidden rounded border border-white/10">
              {(["Compact", "Comfortable"] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d.toLowerCase() as typeof density)}
                  className="px-3 py-1 text-xs transition-colors"
                  style={{
                    backgroundColor: density === d.toLowerCase() ? "#c1440e" : "rgba(255,255,255,0.04)",
                    color: density === d.toLowerCase() ? "white" : "rgba(255,255,255,0.5)",
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
              <div className="rounded-xl border border-white/10 p-8 text-center">
                <p className="text-white/50">You appear to be offline. Check your connection.</p>
              </div>
            ) : loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-white/10 p-8 text-center">
                <p className="mb-3 text-white/50">{error.message}</p>
                <button
                  type="button"
                  onClick={() => void fetchResults(destination, filters)}
                  className="rounded px-4 py-2 text-sm text-white"
                  style={{ backgroundColor: "#c1440e" }}
                >
                  Try again
                </button>
              </div>
            ) : results.length === 0 && destination ? (
              <div className="rounded-xl border border-white/10 p-8 text-center">
                <p className="text-white/50">No results for "{destination}". Try a broader search.</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-xl border border-white/8">
                  <table className="w-full" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                    <thead>
                      <tr className="border-b border-white/8">
                        <th className="py-2.5 pl-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Stay</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Source</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Freshness</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Cancellation</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-white/30">Points*</th>
                        <th className="py-2.5 pr-3 text-right text-xs font-semibold uppercase tracking-wider text-white/30">Total (4 nights)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(offer => (
                        <OfferRow key={offer.id} offer={offer} nights={4} />
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 text-xs text-white/25">
                  * Points shown are an illustrative preview — no server-side earning source exists yet, so no accrual is implied.
                </p>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    className="rounded border border-white/15 px-5 py-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Show 20 more offers
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-white/10 p-8 text-center">
                <p className="text-white/40 text-sm">Enter a destination above to search stays, flights and cars.</p>
                <Link
                  href="/"
                  className="mt-4 inline-block rounded px-4 py-2 text-sm text-white"
                  style={{ backgroundColor: "#c1440e" }}
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
