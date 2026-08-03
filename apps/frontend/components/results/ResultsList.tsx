"use client";

import type { UnifiedOffer } from "@travel/contracts/search";
import { Skeleton } from "@travel/design-system";
import { OfferCard } from "./OfferCard";
import type { ResultDensity } from "../../lib/search-params";

export interface ResultsListProps {
  offers: UnifiedOffer[];
  isLoading: boolean;
  skeleton: boolean;
  density?: ResultDensity;
  error?: string | null;
}

function OfferCardSkeleton(): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border-default p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="30%" />
          <Skeleton height={24} width="70%" />
          <Skeleton height={16} width="40%" />
        </div>
        <div className="space-y-2">
          <Skeleton height={28} width={80} />
          <Skeleton height={32} width={100} />
        </div>
      </div>
    </div>
  );
}

export function ResultsList({
  offers,
  isLoading,
  skeleton,
  density = "comfortable",
  error,
}: ResultsListProps): React.JSX.Element | null {
  if (error) {
    return (
      <div role="alert" aria-label="Search results" className="text-sm text-danger">
        {error}
      </div>
    );
  }

  if (skeleton && isLoading) {
    return (
      <div aria-label="Search results" aria-busy="true" className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <OfferCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!isLoading && offers.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Search results" className="space-y-3">
      {offers.map((offer) => (
        <li key={offer.id}>
          <OfferCard offer={offer} density={density} />
        </li>
      ))}
    </ul>
  );
}
