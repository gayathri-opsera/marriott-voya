"use client";

/**
 * ResultsList with HVMI Priority Sort — WOREF-018
 * Renders a sorted list of AccommodationResultCards.
 * HVMI villas are pinned to the top; Marriott hotels next; partners last.
 * Supports filter + sort panel and freshness badges.
 */

import React, { useMemo, useState } from "react";
import { AccommodationResultCard, AccommodationResult } from "./AccommodationResultCard.js";
import { trackOfferPresented, trackSearchResults } from "../../lib/analytics.js";
import { DegradedResultsBanner } from "./DegradedResultsBanner.js";

export type SortMode = "hvmi_first" | "price_asc" | "price_desc" | "rating";
export type PropertyFilter = "ALL" | "HVMI" | "HOTEL" | "VILLA" | "PARTNER";

export interface ResultsListProps {
  results: AccommodationResult[];
  totalResults?: number;
  cacheStatus?: "HIT" | "MISS" | "STALE";
  fetchedAt?: string;
  fallbackDisclosure?: string;
  latencyMs?: number;
  destination?: string;
}

const SORT_LABELS: Record<SortMode, string> = {
  hvmi_first: "Marriott First",
  price_asc:  "Price: Low–High",
  price_desc: "Price: High–Low",
  rating:     "Top Rated",
};

const FILTER_LABELS: Record<PropertyFilter, string> = {
  ALL:     "All",
  HVMI:    "Homes & Villas",
  HOTEL:   "Hotels",
  VILLA:   "Villas",
  PARTNER: "Partners",
};

function sortResults(results: AccommodationResult[], mode: SortMode): AccommodationResult[] {
  const cloned = [...results];
  if (mode === "hvmi_first") {
    cloned.sort((a, b) => {
      if (a.hvmiPriority && !b.hvmiPriority) return -1;
      if (!a.hvmiPriority && b.hvmiPriority) return 1;
      const classRank = { HVMI: 0, MARRIOTT_DIRECT: 1, ILLUSTRATIVE: 2 };
      const ra = classRank[a.provenance as keyof typeof classRank] ?? 1;
      const rb = classRank[b.provenance as keyof typeof classRank] ?? 1;
      return ra - rb;
    });
  } else if (mode === "price_asc") {
    cloned.sort((a, b) => Number(a.priceSummary?.nightlyRate ?? 0) - Number(b.priceSummary?.nightlyRate ?? 0));
  } else if (mode === "price_desc") {
    cloned.sort((a, b) => Number(b.priceSummary?.nightlyRate ?? 0) - Number(a.priceSummary?.nightlyRate ?? 0));
  }
  return cloned;
}

export function ResultsList({
  results,
  totalResults,
  cacheStatus,
  fetchedAt,
  fallbackDisclosure,
  latencyMs,
  destination,
}: ResultsListProps): React.JSX.Element {
  const [sort, setSort] = useState<SortMode>("hvmi_first");
  const [filter, setFilter] = useState<PropertyFilter>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return results;
    if (filter === "HVMI") return results.filter((r) => r.hvmiPriority || r.provenance === "HVMI");
    if (filter === "HOTEL") return results.filter((r) => r.propertyType === "HOTEL");
    if (filter === "VILLA") return results.filter((r) => r.propertyType === "VILLA" && !r.hvmiPriority);
    if (filter === "PARTNER") return results.filter((r) => r.provenance === "ILLUSTRATIVE");
    return results;
  }, [results, filter]);

  const sorted = useMemo(() => sortResults(filtered, sort), [filtered, sort]);

  // Track impression for analytics
  const trackedRef = React.useRef(false);
  React.useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    if (latencyMs !== undefined && destination) {
      trackSearchResults({
        destination,
        totalResults: results.length,
        hvmiCount: results.filter((r) => r.hvmiPriority).length,
        latencyMs,
        cacheStatus: cacheStatus ?? "MISS",
      });
    }
  }, [results, latencyMs, destination, cacheStatus]);

  return (
    <div>
      {/* Freshness + fallback banner */}
      {fallbackDisclosure && <DegradedResultsBanner message={fallbackDisclosure} />}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {(Object.keys(FILTER_LABELS) as PropertyFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
              style={{
                background: filter === f ? "var(--voya-accent)" : "var(--voya-surface-2)",
                color: filter === f ? "#000" : "var(--voya-text-2)",
              }}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs" style={{ color: "var(--voya-text-3)" }}>Sort:</label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="text-xs rounded-lg px-2 py-1"
            style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-2)", border: "1px solid var(--voya-border)" }}
          >
            {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
              <option key={s} value={s}>{SORT_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Count + freshness */}
      <p className="text-xs mb-3" style={{ color: "var(--voya-text-3)" }}>
        {sorted.length} of {totalResults ?? results.length} results
        {fetchedAt ? ` · Updated ${new Date(fetchedAt).toLocaleTimeString()}` : ""}
        {cacheStatus === "HIT" ? " · Cached" : ""}
        {cacheStatus === "STALE" ? " · Stale — refreshing" : ""}
      </p>

      {/* Cards grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: "var(--voya-text-3)" }}>No results match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map((result, idx) => (
            <div
              key={result.propertyId}
              onMouseEnter={() => {
                trackOfferPresented({
                  propertyId: result.propertyId,
                  provenance: result.provenance ?? "UNKNOWN",
                  hvmiPriority: result.hvmiPriority ?? false,
                  positionIndex: idx,
                  priceUSD: result.priceSummary ? Number(result.priceSummary.nightlyRate) : undefined,
                });
              }}
            >
              <AccommodationResultCard {...result} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
