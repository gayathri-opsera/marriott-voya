"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  Skeleton,
  EmptyState,
} from "@travel/design-system";
import type { SearchResponse, UnifiedOffer } from "@travel/contracts/search";
import { apiGet } from "../../lib/api/client";
import { ApiError } from "../../lib/api/errors";
import { getProvenanceBadgeVariant } from "../../lib/domain/offer";
import { trackEvent, JOURNEY_EVENTS } from "../../lib/analytics";

const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevance", label: "Best Match" },
];

const TYPE_FILTERS = [
  { value: "flight", label: "Flights" },
  { value: "hotel", label: "Hotels" },
  { value: "car", label: "Cars" },
];

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
}

function getOfferType(offer: UnifiedOffer): string {
  if ("departureAirport" in offer.details) return "flight";
  if ("hotelName" in offer.details || "starRating" in offer.details) return "hotel";
  return "car";
}

function ResultCard({ offer }: { offer: UnifiedOffer }) {
  const type = getOfferType(offer);

  return (
    <Card className="border border-border-default hover:shadow-md transition-shadow">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={type === "flight" ? "info" : type === "hotel" ? "success" : "warning"}>
              {type}
            </Badge>
            <Badge variant={getProvenanceBadgeVariant(offer.provenance) as "default"}>
              {offer.provenance}
            </Badge>
          </div>
          <h3 className="font-semibold text-text-primary truncate">{offer.title}</h3>
          <p className="text-sm text-text-secondary mt-0.5">
            Freshness: {offer.freshness}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <div className="text-xl font-bold text-brand-primary">
              {formatPrice(offer.price, offer.currency)}
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href={`/listings/${offer.id}`}>View details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [results, setResults] = React.useState<UnifiedOffer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState("relevance");
  const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
  const [searchInput, setSearchInput] = React.useState(query);

  const fetchResults = React.useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    trackEvent(JOURNEY_EVENTS.SEARCH_STARTED, { query: q, sort });
    try {
      const data = await apiGet<SearchResponse>("/search", {
        q,
        sort,
        types: typeFilter.join(",") || undefined,
      });
      setResults(data.offers);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [sort, typeFilter]);

  React.useEffect(() => {
    fetchResults(query);
  }, [query, fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(searchInput);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search destinations, hotels, flights..."
            className="flex-1"
          />
          <Button type="submit" loading={loading}>Search</Button>
        </form>
      </div>

      <div className="flex gap-6">
        <aside className="w-48 shrink-0 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Type</h3>
            {TYPE_FILTERS.map((f) => (
              <label key={f.value} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={typeFilter.includes(f.value)}
                  onChange={(e) =>
                    setTypeFilter((prev) =>
                      e.target.checked ? [...prev, f.value] : prev.filter((v) => v !== f.value),
                    )
                  }
                  className="accent-brand-primary"
                />
                {f.label}
              </label>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Sort by</h3>
            {SORT_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer mb-1">
                <input
                  type="radio"
                  name="sort"
                  value={o.value}
                  checked={sort === o.value}
                  onChange={() => setSort(o.value)}
                  className="accent-brand-primary"
                />
                {o.label}
              </label>
            ))}
          </div>
        </aside>

        <div className="flex-1 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={120} className="rounded-lg" />
            ))
          ) : error ? (
            <EmptyState title="Search failed" description={error} />
          ) : results.length === 0 && query ? (
            <EmptyState
              title="No results found"
              description={`We couldn't find anything matching "${query}". Try a different search.`}
            />
          ) : (
            results.map((r) => <ResultCard key={r.id} offer={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
