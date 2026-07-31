"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { UnifiedOffer } from "@travel/contracts/search";
import { Badge, Button, Card, CardContent, CardHeader } from "@travel/design-system";
import { StateBoundary } from "../../../components/patterns/StateBoundary";
import { ExpiryCountdown } from "../../../components/results/ExpiryCountdown";
import { apiGet } from "../../../lib/api/client";
import { ApiError } from "../../../lib/api/errors";
import { canProceedToCheckout } from "../../../lib/domain/checkout";
import {
  getProvenanceBadgeVariant,
  getProvenanceLabel,
  isBookable,
} from "../../../lib/domain/offer";
import { formatMoney } from "../../../lib/money";

function getOfferType(offer: UnifiedOffer): string {
  if ("departureAirport" in offer.details) return "flight";
  if ("hotelName" in offer.details || "starRating" in offer.details) return "hotel";
  return "car";
}

function getFreshnessVariant(freshness: UnifiedOffer["freshness"]): "freshness-fresh" | "freshness-stale" | "default" {
  if (freshness === "FRESH") return "freshness-fresh";
  if (freshness === "STALE") return "freshness-stale";
  return "default";
}

export default function ListingDetailPage(): React.JSX.Element {
  const params = useParams();
  const offerId = params.id as string;
  const [offer, setOffer] = React.useState<UnifiedOffer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadOffer = React.useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<UnifiedOffer>(`/offers/${offerId}`)
      .then(setOffer)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError(new Error("This listing is no longer available."));
        } else {
          setError(new Error("Failed to load listing. Please try again."));
        }
      })
      .finally(() => setLoading(false));
  }, [offerId]);

  React.useEffect(() => {
    loadOffer();
  }, [loadOffer]);

  const screenState = loading ? "loading" : error ? "error" : offer ? "idle" : "empty";
  const checkoutGuard = offer
    ? canProceedToCheckout(offer)
    : { allowed: false, reason: undefined };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <StateBoundary state={screenState} error={error} onRetry={loadOffer}>
        {offer && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="info">{getOfferType(offer)}</Badge>
              <Badge variant={getProvenanceBadgeVariant(offer.provenance) as "default"}>
                {getProvenanceLabel(offer.provenance)}
              </Badge>
              <Badge variant={getFreshnessVariant(offer.freshness) as "default"}>
                {offer.freshness}
              </Badge>
              {isBookable(offer) ? (
                <Badge variant="success">Bookable</Badge>
              ) : (
                <Badge variant="default">Not bookable</Badge>
              )}
            </div>

            <h1 className="mb-2 text-2xl font-bold text-text-primary">{offer.title}</h1>
            <ExpiryCountdown expiresAt={offer.expiresAt} className="mb-4 text-sm text-warning" />

            {offer.rating !== undefined && (
              <p className="mb-4 text-sm text-text-secondary">
                Rating: {offer.rating.toFixed(1)}
                {offer.reviews !== undefined ? ` (${offer.reviews} reviews)` : ""}
              </p>
            )}

            <Card className="mb-6 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-3xl font-bold text-brand-primary">
                      {formatMoney(offer.price, offer.currency)}
                    </div>
                    {!checkoutGuard.allowed && checkoutGuard.reason && (
                      <p className="mt-2 text-sm text-text-secondary">{checkoutGuard.reason}</p>
                    )}
                  </div>
                  {checkoutGuard.allowed && (
                    <Button size="lg" asChild>
                      <Link href={`/checkout?offerId=${offer.id}`}>Book Now</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">Details</h2>
              </CardHeader>
              <CardContent className="p-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(offer.details).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <dt className="text-sm font-medium capitalize text-text-secondary">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </dt>
                      <dd className="text-sm text-text-primary">{String(value)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </>
        )}
      </StateBoundary>
    </div>
  );
}
