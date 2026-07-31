"use client";

import * as React from "react";
import Link from "next/link";
import type { UnifiedOffer } from "@travel/contracts/search";
import { Badge, Button, Card, CardContent } from "@travel/design-system";
import { formatMoney } from "../../lib/money";
import { useLocaleCurrency } from "../../hooks/useLocaleCurrency";
import {
  getProvenanceBadgeVariant,
  getProvenanceLabel,
  isBookable,
} from "../../lib/domain/offer";
import { ExpiryCountdown } from "./ExpiryCountdown";
import type { ResultDensity } from "../../lib/search-params";
import { cn } from "../../lib/utils";

export interface OfferCardProps {
  offer: UnifiedOffer;
  density?: ResultDensity;
}

const densityPadding: Record<ResultDensity, string> = {
  compact: "p-3",
  comfortable: "p-4",
  spacious: "p-6",
};

export function OfferCard({ offer, density = "comfortable" }: OfferCardProps): React.JSX.Element {
  const { locale, currency } = useLocaleCurrency();
  const displayCurrency = currency || offer.currency;
  const bookable = isBookable(offer);
  const illustrative = offer.provenance === "ILLUSTRATIVE" || !bookable;

  // Extended fields from HVMI-aware search service
  const extOffer = offer as UnifiedOffer & { tag?: string; hvmiCollection?: string; hvmiCollectionUrl?: string };
  const isHvmi = extOffer.tag?.startsWith("HVMI");
  const isFallback = extOffer.tag?.startsWith("FALLBACK");
  const hvmiCollection = extOffer.hvmiCollection;

  const freshnessVariant =
    offer.freshness === "FRESH"
      ? "freshness-fresh"
      : offer.freshness === "STALE"
        ? "freshness-stale"
        : "default";

  return (
    <Card
      role="article"
      aria-label={`${offer.title}, ${formatMoney(offer.price, displayCurrency, locale)}`}
      className={cn(
        "relative border transition-shadow hover:shadow-md",
        isHvmi ? "border-brand-primary/30 bg-brand-primary/3" : "border-border-default",
        illustrative && "opacity-90",
      )}
    >
      {/* HVMI top-strip indicator */}
      {isHvmi && (
        <div className="rounded-t-xl bg-brand-primary px-4 py-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-wide">
            Homes &amp; Villas by Marriott Bonvoy
          </span>
          {hvmiCollection && (
            <span className="text-xs text-white/80">{hvmiCollection}</span>
          )}
        </div>
      )}
      {/* Fallback disclosure strip */}
      {isFallback && (
        <div className="rounded-t-xl bg-surface-secondary px-4 py-1">
          <span className="text-xs text-text-secondary">Marriott Hotel Brand — shown because no HVMI villa is available at this exact location</span>
        </div>
      )}

      {illustrative && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-end rounded-xl bg-surface-default/60"
          aria-hidden
        >
          <p className="w-full rounded-b-xl bg-surface-muted/80 px-4 py-2 text-center text-xs font-medium text-text-muted">
            Illustrative — cannot be booked
          </p>
        </div>
      )}

      <CardContent className={cn("flex items-start justify-between gap-4", densityPadding[density])}>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={getProvenanceBadgeVariant(offer.provenance) as "default"}>
              {getProvenanceLabel(offer.provenance)}
            </Badge>
            {offer.freshness && <Badge variant={freshnessVariant as "default"}>{offer.freshness}</Badge>}
            {bookable ? (
              <Badge variant="success">Bookable</Badge>
            ) : (
              <Badge variant="default">Not bookable</Badge>
            )}
          </div>
          <h3 className="font-semibold text-text-primary leading-snug">{offer.title}</h3>
          <ExpiryCountdown expiresAt={offer.expiresAt} className="mt-1" />
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right text-xl font-bold text-brand-primary">
            {formatMoney(offer.price, displayCurrency, locale)}
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/listings/${offer.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default OfferCard;
