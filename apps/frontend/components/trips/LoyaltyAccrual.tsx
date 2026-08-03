"use client";

import * as React from "react";
import { Badge } from "@travel/design-system";

export interface LoyaltyAccrualProps {
  points: number;
  isIllustrative: boolean;
  programName: string;
}

export function LoyaltyAccrual({
  points,
  isIllustrative,
  programName,
}: LoyaltyAccrualProps): React.JSX.Element {
  const formatted = points.toLocaleString();

  if (isIllustrative) {
    return (
      <span
        className="inline-flex items-center gap-1 text-sm text-text-muted"
        data-testid="loyalty-accrual"
        title="Loyalty estimate only"
      >
        <span aria-label="Loyalty estimate only">≈ {formatted} pts</span>
        <span
          className="cursor-help text-text-tertiary"
          aria-label="Loyalty estimate only — not guaranteed"
          title="Loyalty estimate only"
        >
          ⓘ
        </span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-2 text-sm text-text-primary"
      data-testid="loyalty-accrual"
    >
      <span>{formatted} pts</span>
      <Badge variant="default">{programName}</Badge>
    </span>
  );
}
