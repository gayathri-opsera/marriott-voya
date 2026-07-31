"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SearchResponse, UnifiedOffer } from "@travel/contracts/search";
import { apiGet } from "../../lib/api/client";
import { ApiError, ErrorCode } from "../../lib/api/errors";
import { trackEvent, JOURNEY_EVENTS } from "../../lib/analytics";
import { StateBoundary } from "../../components/patterns/StateBoundary";
import {
  SearchCriteriaForm,
  type SearchCriteria,
} from "../../components/search/SearchCriteriaForm";
import { FilterPanel, type Filters } from "../../components/search/FilterPanel";
import { ResultsList } from "../../components/results/ResultsList";
import {
  DegradedResultsBanner,
  type SupplierStatus,
} from "../../components/search/DegradedResultsBanner";
import { parseSearchParams, toSearchParams, type SearchState } from "../../lib/search-params";
import { getEntryCriteria } from "../../lib/entry-criteria";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

type SearchResponseWithSuppliers = SearchResponse & {
  supplierStatuses?: SupplierStatus[];
};

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

  // HVMI-first sourcing rule: always pin HVMI properties above fallbacks,
  // then sort within each tier so user sort preferences are preserved.
  const isHvmi = (o: UnifiedOffer) => typeof (o as { tag?: string }).tag === "string" && ((o as { tag?: string }).tag ?? "").startsWith("HVMI");
  const sortFn = (a: UnifiedOffer, b: UnifiedOffer): number => {
    switch (filters.sort) {
      case "price_desc": return Number(b.price) - Number(a.price);
      case "rating": return (b.rating ?? 0) - (a.rating ?? 0);
      case "duration": {
        const durA = "duration" in a.details ? String(a.details.duration ?? "") : "";
        const durB = "duration" in b.details ? String(b.details.duration ?? "") : "";
        return durA.localeCompare(durB);
      }
      default: return Number(a.price) - Number(b.price); // price_asc
    }
  };

  const hvmi = result.filter(isHvmi).sort(sortFn);
  const rest = result.filter((o) => !isHvmi(o)).sort(sortFn);
  return [...hvmi, ...rest];
}

function mapSearchError(error: Error): Error {
  if (error instanceof ApiError) {
    if (error.code === ErrorCode.NETWORK_ERROR || error.status === 0) {
      return new ApiError(error.status, error.code, "Check your connection and try again");
    }
    if (error.status === 504 || error.code === "timeout") {
      return new ApiError(error.status, error.code, "Search took too long. Try again with fewer filters");
    }
  }
  return error;
}

function getScreenState(
  isOnline: boolean,
  loading: boolean,
  error: Error | null,
  hasQuery: boolean,
  resultCount: number,
): "idle" | "loading" | "empty" | "error" | "offline" {
  if (!isOnline) return "offline";
  if (loading) return "loading";
  if (error) return "error";
  if (hasQuery && resultCount === 0) return "empty";
  return "idle";
}

export default function SearchPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOnline } = useOnlineStatus();
  const urlState = React.useMemo(
    () => parseSearchParams(searchParams),
    [searchParams],
  );

  const [results, setResults] = React.useState<UnifiedOffer[]>([]);
  const [supplierStatuses, setSupplierStatuses] = React.useState<SupplierStatus[]>([]);
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
      if (!navigator.onLine) {
        setError(new ApiError(0, ErrorCode.NETWORK_ERROR, "Check your connection and try again"));
        return;
      }

      setLoading(true);
      setError(null);

      trackEvent(JOURNEY_EVENTS.SEARCH_STARTED, {
        query: criteria.destination,
        type: criteria.type,
        sort: currentFilters.sort,
      });

      try {
        const data = await apiGet<SearchResponseWithSuppliers>("/search", {
          q: criteria.destination,
          sort: currentFilters.sort,
          types: mapTypeToApi(criteria.type),
        });
        setResults(applyClientFilters(data.offers, currentFilters));
        setSupplierStatuses(data.supplierStatuses ?? []);
      } catch (err) {
        const mapped = mapSearchError(
          err instanceof ApiError ? err : new Error("Search failed. Please try again."),
        );
        setError(mapped);
        setResults([]);
        setSupplierStatuses([]);
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

  const handleRetry = (): void => {
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
  };

  const hasQuery = Boolean(urlState.q ?? entryCriteria?.destination);
  const screenState = getScreenState(isOnline, loading, error, hasQuery, results.length);
  const mappedError = error ? mapSearchError(error) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-2xl font-bold text-text-primary">Search</h1>
        <SearchCriteriaForm
          initialValues={initialCriteria}
          onSubmit={handleCriteriaSubmit}
          loading={loading}
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

        <div className="flex-1">
          <DegradedResultsBanner supplierStatuses={supplierStatuses} />
          <StateBoundary
            state={screenState}
            error={mappedError}
            onRetry={handleRetry}
            emptyTitle="No results found"
            emptyDescription="No results found. Try adjusting your search"
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
