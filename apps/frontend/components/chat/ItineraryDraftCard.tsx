"use client";

/**
 * ItineraryDraftCard — WOREF-003
 * Renders a compact itinerary draft preview inline in the AI chat stream.
 * Shows destination, dates, Bonvoy points, and accept/edit CTA.
 */

import React from "react";
import Link from "next/link";

interface ItineraryDraftItem {
  type: string;
  label: string;
  date?: string;
  price?: number;
  currency?: string;
}

export interface ItineraryDraftCardProps {
  draftId: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  totalUSD?: number;
  totalBonvoyPoints?: number;
  status?: string;
  items?: ItineraryDraftItem[];
  onAccept?: (draftId: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  ACCOMMODATION: "🏡",
  ACTIVITY: "🎭",
  FLIGHT: "✈️",
  TRANSPORT: "🚗",
  DINING: "🍽️",
};

export function ItineraryDraftCard({
  draftId,
  destination,
  checkIn,
  checkOut,
  totalUSD,
  totalBonvoyPoints,
  status = "DRAFT",
  items = [],
  onAccept,
}: ItineraryDraftCardProps): React.JSX.Element {
  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
  );

  const isAccepted = status === "ACCEPTED" || status === "BOOKED";

  return (
    <div
      className="rounded-2xl overflow-hidden my-2"
      style={{ border: "1px solid var(--voya-border)", background: "var(--voya-surface-1)" }}
    >
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--voya-border)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: "var(--voya-text-1)" }}>
              📋 {destination}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>
              {checkIn} → {checkOut} · {nights} night{nights !== 1 ? "s" : ""}
            </p>
          </div>
          {isAccepted && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#05966920", color: "#059669" }}>
              ✓ Accepted
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-2">
          {totalUSD !== undefined && (
            <div>
              <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>Total </span>
              <span className="text-sm font-bold" style={{ color: "var(--voya-text-1)" }}>
                ${totalUSD.toLocaleString()}
              </span>
            </div>
          )}
          {totalBonvoyPoints !== undefined && (
            <div>
              <span className="text-xs" style={{ color: "var(--voya-text-3)" }}>Points </span>
              <span className="text-sm font-bold" style={{ color: "var(--voya-amber)" }}>
                +{totalBonvoyPoints.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Items preview (max 4) */}
      {items.length > 0 && (
        <ul className="px-4 py-2 space-y-1">
          {items.slice(0, 4).map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--voya-text-2)" }}>
              <span>{TYPE_ICONS[item.type] ?? "📍"}</span>
              <span>{item.label}</span>
              {item.price !== undefined && (
                <span className="ml-auto" style={{ color: "var(--voya-text-3)" }}>
                  {item.price === 0 ? "Free" : `${item.currency ?? "USD"} ${item.price}`}
                </span>
              )}
            </li>
          ))}
          {items.length > 4 && (
            <li className="text-xs" style={{ color: "var(--voya-text-3)" }}>
              +{items.length - 4} more items
            </li>
          )}
        </ul>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid var(--voya-border)" }}>
        {!isAccepted && onAccept && (
          <button
            onClick={() => onAccept(draftId)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--voya-accent)", color: "#000" }}
          >
            Accept itinerary
          </button>
        )}
        <Link
          href={`/itineraries/${draftId}`}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-center"
          style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-2)" }}
        >
          {isAccepted ? "View details" : "Edit / view"}
        </Link>
      </div>
    </div>
  );
}
