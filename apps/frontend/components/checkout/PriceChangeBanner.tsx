"use client";

/**
 * PriceChangeBanner — WOREF-025
 * Shown in checkout when the price has changed since the user saw the offer.
 * Implements the "price change acknowledgement" gate — user must acknowledge before proceeding.
 */

import React, { useState } from "react";

export interface PriceChangeInfo {
  previousPrice: number;
  currentPrice: number;
  currency: string;
  direction: "increase" | "decrease";
}

interface PriceChangeBannerProps {
  priceChange: PriceChangeInfo;
  onAcknowledge: () => void;
  onCancel?: () => void;
}

export function PriceChangeBanner({ priceChange, onAcknowledge, onCancel }: PriceChangeBannerProps): React.JSX.Element {
  const [acknowledged, setAcknowledged] = useState(false);
  const diff = Math.abs(priceChange.currentPrice - priceChange.previousPrice);
  const isIncrease = priceChange.direction === "increase";

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge();
  };

  return (
    <div
      role="alert"
      className="rounded-xl p-4 mb-4"
      style={{
        background: isIncrease ? "#fef2f220" : "#f0fdf420",
        border: `1px solid ${isIncrease ? "#ef444440" : "#22c55e40"}`,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{isIncrease ? "⚠️" : "🎉"}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-sm" style={{ color: isIncrease ? "#ef4444" : "#22c55e" }}>
            {isIncrease ? "Price has increased" : "Price has decreased"}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-2)" }}>
            {isIncrease ? (
              <>
                The price for this property has increased by{" "}
                <strong>{priceChange.currency} {diff.toFixed(2)}</strong> since you viewed it.
                New price:{" "}
                <strong>{priceChange.currency} {priceChange.currentPrice.toFixed(2)}</strong>/night.
              </>
            ) : (
              <>
                Great news — the price has dropped by{" "}
                <strong>{priceChange.currency} {diff.toFixed(2)}</strong>!
                New price:{" "}
                <strong>{priceChange.currency} {priceChange.currentPrice.toFixed(2)}</strong>/night.
              </>
            )}
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAcknowledge}
              disabled={acknowledged}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: isIncrease ? "#ef4444" : "#22c55e", color: "#fff" }}
            >
              {acknowledged ? "Acknowledged ✓" : isIncrease ? "Accept new price" : "Continue with new price"}
            </button>
            {onCancel && !acknowledged && (
              <button
                onClick={onCancel}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-2)" }}
              >
                Search again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
