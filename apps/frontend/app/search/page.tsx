"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SearchResponse, UnifiedOffer } from "@travel/contracts/search";
import { apiGet } from "../../lib/api/client";
import { ApiError } from "../../lib/api/errors";
import { trackEvent, JOURNEY_EVENTS } from "../../lib/analytics";
import { StateBoundary } from "../../components/patterns/StateBoundary";
import {
  SearchCriteriaForm,
  type SearchCriteria,
} from "../../components/search/SearchCriteriaForm";
import { FilterPanel, type Filters } from "../../components/search/FilterPanel";
import { ResultsList } from "../../components/results/ResultsList";
import { parseSearchParams, toSearchParams, type SearchState } from "../../lib/search-params";
import { getEntryCriteria } from "../../lib/entry-criteria";

function mapTypeToApi(type: SearchCriteria["type"]): string {
  if (type === "flights") return "flight";
  if (type === "hotels") return "hotel";
  return "car";
}

function applyClientFilters(offers: UnifiedOffer[], filters: Filters): UnifiedOffer[] {
  let result = [...offers];

  if (filters.minPrice !== undefined) {
    result = result.filter((o) => Number(o.price) >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((o) => Number(o.price) <= filters.maxPrice!);
  }

  switch (filters.sort) {
    case "price_asc":
      result.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "price_desc":
      result.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "rating":
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "duration":
      result.sort((a, b) => {
        const durA = "duration" in a.details ? String(a.details.duration ?? "") : "";
        const durB = "duration" in b.details ? String(b.details.duration ?? "") : "";
        return durA.localeCompare(durB);
      });
      break;
  }

  return result;
}

function getScreenState(
  loading: boolean,
  error: Error | null,
  hasQuery: boolean,
  resultCount: number,
): "idle" | "loading" | "empty" | "error" {
  if (loading) return "loading";
  if (error) return "error";
  if (hasQuery && resultCount === 0) return "empty";
  return "idle";
}

export default function SearchPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlState = React.useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );

  const [results, setResults] = React.useState<UnifiedOffer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState<Filters>({
    sort: urlState.sort ?? "price_asc",
    density: urlState.density ?? "comfortable",
    minPrice: urlState.minPrice,
    maxPrice: urlState.maxPrice,
  });

  const entryCriteria = React.useMemo(() => getEntryCriteria(), []);

  const initialCriteria = React.useMemo(
    (): Partial<SearchCriteria> => ({
      destination: urlState.q ?? entryCriteria?.destination ?? "",
      type: urlState.type ?? entryCriteria?.type ?? "flights",
      departureDate: urlState.date ?? entryCriteria?.date ?? "",
      returnDate: urlState.returnDate,
      passengers: urlState.passengers ?? entryCriteria?.passengers ?? 1,
    }),
    [urlState, entryCriteria],
  );

  const syncUrl = React.useCallback(
    (state: SearchState) => {
      const params = toSearchParams(state);
      const query = params.toString();
      router.replace(query ? `/search?${query}` : "/search");
    },
    [router],
  );

  const fetchResults = React.useCallback(
    async (criteria: SearchCriteria, currentFilters: Filters) => {
      if (!criteria.destination.trim()) return;

      setLoading(true);
      setError(null);

      trackEvent(JOURNEY_EVENTS.SEARCH_STARTED, {
        query: criteria.destination,
        type: criteria.type,
        sort: currentFilters.sort,
      });

      try {
        const data = await apiGet<SearchResponse>("/search", {
          q: criteria.destination,
          sort: currentFilters.sort,
          types: mapTypeToApi(criteria.type),
        });
        setResults(applyClientFilters(data.offers, currentFilters));
      } catch (err) {
        setError(err instanceof ApiError ? err : new Error("Search failed. Please try again."));
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      sort: urlState.sort ?? prev.sort,
      density: urlState.density ?? prev.density,
      minPrice: urlState.minPrice,
      maxPrice: urlState.maxPrice,
    }));
  }, [urlState.sort, urlState.density, urlState.minPrice, urlState.maxPrice]);

  React.useEffect(() => {
    const q = urlState.q ?? entryCriteria?.destination;
    if (!q) return;

    void fetchResults(
      {
        destination: q,
        type: urlState.type ?? entryCriteria?.type ?? "flights",
        departureDate: urlState.date ?? entryCriteria?.date ?? "",
        returnDate: urlState.returnDate,
        passengers: urlState.passengers ?? entryCriteria?.passengers ?? 1,
      },
      {
        sort: urlState.sort ?? "price_asc",
        density: urlState.density ?? "comfortable",
        minPrice: urlState.minPrice,
        maxPrice: urlState.maxPrice,
      },
    );
  }, [urlState, entryCriteria, fetchResults]);

  const handleCriteriaSubmit = (criteria: SearchCriteria): void => {
    syncUrl({
      q: criteria.destination,
      type: criteria.type,
      date: criteria.departureDate,
      returnDate: criteria.returnDate,
      passengers: criteria.passengers,
      sort: filters.sort,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      density: filters.density,
    });
  };

  const handleFilterChange = (next: Filters): void => {
    setFilters(next);
    syncUrl({
      q: urlState.q ?? initialCriteria.destination,
      type: urlState.type ?? initialCriteria.type,
      date: urlState.date ?? initialCriteria.departureDate,
      returnDate: urlState.returnDate,
      passengers: urlState.passengers ?? initialCriteria.passengers,
      sort: next.sort,
      minPrice: next.minPrice,
      maxPrice: next.maxPrice,
      density: next.density,
    });

    if (urlState.q || initialCriteria.destination) {
      void fetchResults(
        {
          destination: urlState.q ?? initialCriteria.destination ?? "",
          type: urlState.type ?? initialCriteria.type ?? "flights",
          departureDate: urlState.date ?? initialCriteria.departureDate ?? "",
          returnDate: urlState.returnDate,
          passengers: urlState.passengers ?? initialCriteria.passengers ?? 1,
        },
        next,
      );
    }
  };

  const hasQuery = Boolean(urlState.q ?? entryCriteria?.destination);
  const screenState = getScreenState(loading, error, hasQuery, results.length);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Search</h1>
        <SearchCriteriaForm
          initialValues={initialCriteria}
          onSubmit={handleCriteriaSubmit}
          loading={loading}
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

        <div className="flex-1">
          <StateBoundary
            state={screenState}
            error={error}
            onRetry={() => {
              if (initialCriteria.destination) {
                void fetchResults(
                  {
                    destination: initialCriteria.destination,
                    type: initialCriteria.type ?? "flights",
                    departureDate: initialCriteria.departureDate ?? "",
                    returnDate: initialCriteria.returnDate,
                    passengers: initialCriteria.passengers ?? 1,
                  },
                  filters,
                );
              }
            }}
          >
            <ResultsList
              offers={results}
              isLoading={loading}
              skeleton
              density={filters.density}
            />
          </StateBoundary>
        </div>
      </div>
    </div>
  );
}
