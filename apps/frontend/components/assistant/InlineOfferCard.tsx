"use client";

import * as React from "react";
import Link from "next/link";
import type { UnifiedOffer } from "@travel/contracts/search";
import { Badge, Button, Card, CardContent } from "@travel/design-system";
import { formatMoney } from "../../lib/money";
import { getProvenanceLabel } from "../../lib/domain/offer";

export interface InlineOfferCardProps {
  offer: UnifiedOffer;
}

export function InlineOfferCard({ offer }: InlineOfferCardProps): React.JSX.Element {
  return (
    <Card
      role="article"
      aria-label={`${offer.title}, ${formatMoney(offer.price, offer.currency)}`}
      className="max-w-sm border border-border-default"
      data-testid="inline-offer-card"
    >
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="default">{getProvenanceLabel(offer.provenance)}</Badge>
          </div>
          <p className="truncate text-sm font-medium text-text-primary">{offer.title}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-bold text-brand-primary">
            {formatMoney(offer.price, offer.currency)}
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/listings/${offer.id}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
