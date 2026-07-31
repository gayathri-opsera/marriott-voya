"use client";

import * as React from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { formatMoney } from "../../lib/money";

export interface ReviewOffer {
  title: string;
  price: string;
  currency: string;
  provenance: string;
  bookable: boolean;
  expiresAt?: string;
}

export interface ReviewStepProps {
  offer: ReviewOffer;
  onContinue: () => void;
}

function getMinutesUntilExpiry(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60_000));
}

function getProvenanceVariant(provenance: string): "info" | "success" | "warning" | "default" {
  switch (provenance) {
    case "AMADEUS":
      return "info";
    case "RAPIDAPI":
      return "success";
    case "ILLUSTRATIVE":
      return "warning";
    default:
      return "default";
  }
}

export function ReviewStep({ offer, onContinue }: ReviewStepProps) {
  const minutesLeft = offer.expiresAt ? getMinutesUntilExpiry(offer.expiresAt) : null;
  const showExpiryWarning = minutesLeft !== null && minutesLeft <= 10;
  const showDisclosure = offer.provenance === "ILLUSTRATIVE" || !offer.bookable;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Review your selection</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {showDisclosure && (
          <div
            role="alert"
            className="rounded-md border border-warning bg-warning-light px-3 py-2 text-sm text-warning"
          >
            This is an illustrative offer and cannot be booked
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-text-secondary">{offer.title}</p>
            <div className="flex items-center gap-2">
              <Badge variant={getProvenanceVariant(offer.provenance)}>{offer.provenance}</Badge>
              <Badge variant={offer.bookable ? "success" : "warning"}>
                {offer.bookable ? "Bookable" : "Not bookable"}
              </Badge>
            </div>
          </div>
          <span className="font-bold text-brand-600 whitespace-nowrap">
            {formatMoney(offer.price, offer.currency)}
          </span>
        </div>

        {showExpiryWarning && minutesLeft !== null && (
          <p className="text-sm font-medium text-warning">Expires in {minutesLeft} min</p>
        )}

        <Button onClick={onContinue} className="w-full" disabled={!offer.bookable}>
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
