"use client";

import * as React from "react";
import { Button } from "../ui/Button";
import { formatMoney } from "../../lib/money";

export interface PriceChangeBannerProps {
  originalPrice: string;
  newPrice: string;
  currency: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function PriceChangeBanner({
  originalPrice,
  newPrice,
  currency,
  onAccept,
  onDecline,
}: PriceChangeBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-warning bg-warning-light p-4 space-y-4"
    >
      <p className="text-sm font-medium text-text-primary">
        The price for this offer has changed. Please review and confirm.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-text-tertiary mb-1">Original price</p>
          <p className="text-lg font-semibold text-text-secondary line-through">
            {formatMoney(originalPrice, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-1">New price</p>
          <p className="text-lg font-semibold text-brand-600">
            {formatMoney(newPrice, currency)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" type="button" onClick={onDecline}>
          Decline
        </Button>
        <Button type="button" onClick={onAccept} className="flex-1">
          Accept new price
        </Button>
      </div>
    </div>
  );
}
