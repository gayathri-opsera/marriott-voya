"use client";

/**
 * LoyaltyAccrual — WOREF-035
 * Displays Bonvoy points that will be earned from a booking.
 * Shown in checkout and on confirmation, reinforcing the Marriott loyalty value prop.
 */

import React from "react";

export interface LoyaltyAccrualProps {
  pointsForStay: number;
  pointsPerDollar?: number;
  memberTier?: "SILVER" | "GOLD" | "PLATINUM" | "TITANIUM" | "AMBASSADOR" | "MEMBER";
  estimatedNights?: number;
  nightsToNextTier?: number;
}

const TIER_MULTIPLIERS: Record<string, number> = {
  MEMBER: 10,
  SILVER: 12,
  GOLD: 14,
  PLATINUM: 15,
  TITANIUM: 15,
  AMBASSADOR: 15,
};

const TIER_COLORS: Record<string, string> = {
  MEMBER: "#6b7280",
  SILVER: "#9ca3af",
  GOLD: "#d97706",
  PLATINUM: "#7c3aed",
  TITANIUM: "#1d4ed8",
  AMBASSADOR: "#c1440e",
};

export function LoyaltyAccrual({
  pointsForStay,
  pointsPerDollar,
  memberTier = "MEMBER",
  estimatedNights,
  nightsToNextTier,
}: LoyaltyAccrualProps): React.JSX.Element {
  const tierColor = TIER_COLORS[memberTier] ?? "#d97706";
  const multiplier = pointsPerDollar ?? TIER_MULTIPLIERS[memberTier] ?? 10;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: `${tierColor}12`, border: `1px solid ${tierColor}30` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: tierColor }}>⭐</span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--voya-text-1)" }}>
          Marriott Bonvoy Points Earned
        </h3>
        <span
          className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: `${tierColor}20`, color: tierColor }}
        >
          {memberTier}
        </span>
      </div>

      {/* Main points display */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: tierColor }}>
          +{pointsForStay.toLocaleString()}
        </span>
        <span className="text-sm" style={{ color: "var(--voya-text-2)" }}>pts</span>
      </div>
      <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>
        {multiplier}× points per dollar spent · credited after check-out
      </p>

      {/* Elite night credit */}
      {estimatedNights !== undefined && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--voya-border)" }}>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>Elite night credits</span>
            <span className="text-xs font-medium" style={{ color: "var(--voya-text-2)" }}>
              +{estimatedNights} nights
            </span>
          </div>
          {nightsToNextTier !== undefined && nightsToNextTier > 0 && (
            <p className="text-xs mt-0.5" style={{ color: tierColor }}>
              {nightsToNextTier} more nights to next tier upgrade
            </p>
          )}
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: "var(--voya-text-3)" }}>
        Not a member?{" "}
        <a href="https://www.marriott.com/loyalty/merch/default.mi" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: tierColor }}>
          Join Bonvoy free
        </a>
      </p>
    </div>
  );
}
