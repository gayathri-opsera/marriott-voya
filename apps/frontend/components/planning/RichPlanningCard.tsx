"use client";

/**
 * RichPlanningCard — WOREF-014 (Capstone)
 * The final rich card format for displaying a complete AI-generated trip plan.
 * Aggregates: property, dates, activities, Bonvoy points, source attribution,
 * freshness, price change detection, and accept/checkout actions.
 */

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FreshnessBadge } from "../search/FreshnessBadge.js";
import { SourceBadge } from "../search/SourceBadge.js";
import { LoyaltyAccrual } from "../checkout/LoyaltyAccrual.js";
import { isExpiringSoon, guardOffer, GuardableOffer } from "../../lib/offer-guard.js";
import { acceptItinerary } from "../../lib/itinerary-actions.js";
import { notifyStatusChange } from "../notifications/StatusChangeNotification.js";

export interface PlanActivity {
  name: string;
  type: string;
  date: string;
  durationHours?: number;
  price?: number;
  currency?: string;
  bonvoyPoints?: number;
  source?: string;
  imageUrl?: string;
}

export interface RichPlanningCardProps {
  // Core offer
  offer: GuardableOffer & {
    propertyId?: string;
    propertyName: string;
    propertyType?: string;
    checkIn: string;
    checkOut: string;
    nightlyRate?: number;
    currency?: string;
    heroImageUrl?: string;
    previousPrice?: number;
    source?: string;
    hvmiCollection?: string;
  };
  // Itinerary
  draftId?: string;
  activities?: PlanActivity[];
  totalUSD?: number;
  totalBonvoyPoints?: number;
  // Freshness
  fetchedAt?: string;
  expiresAt?: string;
  // Membership
  memberTier?: "SILVER" | "GOLD" | "PLATINUM" | "TITANIUM" | "AMBASSADOR" | "MEMBER";
  estimatedNights?: number;
}

export function RichPlanningCard({
  offer,
  draftId,
  activities = [],
  totalUSD,
  totalBonvoyPoints,
  fetchedAt,
  expiresAt,
  memberTier,
  estimatedNights,
}: RichPlanningCardProps): React.JSX.Element {
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const guard = guardOffer({ ...offer, expiresAt });
  const expiringSoon = isExpiringSoon({ expiresAt });
  const nights = Math.round(
    (new Date(offer.checkOut).getTime() - new Date(offer.checkIn).getTime()) / 86_400_000,
  );
  const hasActivities = activities.length > 0;
  const heroImage = offer.heroImageUrl ?? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";

  const handleAccept = async () => {
    if (!draftId) return;
    setAccepting(true);
    const result = await acceptItinerary(draftId);
    setAccepting(false);
    if (result.ok) {
      setAccepted(true);
      notifyStatusChange({
        type: "ITINERARY_ACCEPTED",
        title: "Itinerary accepted!",
        body: `Your trip to ${offer.propertyName} is ready for checkout.`,
        priority: "HIGH",
      });
    }
  };

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--voya-border)", background: "var(--voya-surface-1)" }}
    >
      {/* Hero image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={heroImage}
          alt={offer.propertyName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
          unoptimized={heroImage.includes("unsplash.com")}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {offer.source && <SourceBadge source={offer.source as string} />}
          {offer.hvmiCollection && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-black/60 text-white">
              {offer.hvmiCollection}
            </span>
          )}
        </div>

        {expiringSoon && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium bg-orange-500 text-white">
            ⏱ Pricing expires soon
          </div>
        )}

        {/* Property info overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h2 className="text-white font-bold text-base leading-tight">{offer.propertyName}</h2>
          <p className="text-white/80 text-xs mt-0.5">
            {offer.checkIn} → {offer.checkOut} · {nights} night{nights !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Freshness */}
        {fetchedAt && (
          <div className="mb-3">
            <FreshnessBadge fetchedAt={fetchedAt} expiresAt={expiresAt} />
          </div>
        )}

        {/* Price summary */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            {offer.nightlyRate && (
              <div>
                <span className="text-xl font-bold" style={{ color: "var(--voya-text-1)" }}>
                  {offer.currency ?? "USD"} {offer.nightlyRate.toLocaleString()}
                </span>
                <span className="text-xs ml-1" style={{ color: "var(--voya-text-3)" }}>/night</span>
              </div>
            )}
            {totalUSD && (
              <p className="text-xs" style={{ color: "var(--voya-text-3)" }}>
                Total: {offer.currency ?? "USD"} {totalUSD.toLocaleString()}
              </p>
            )}
          </div>
          {accepted && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#05966920", color: "#059669" }}>
              ✓ Accepted
            </span>
          )}
        </div>

        {/* Activities preview */}
        {hasActivities && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-medium w-full text-left"
              style={{ color: "var(--voya-text-2)" }}
            >
              <span>📅 {activities.length} activities planned</span>
              <span className="ml-auto">{expanded ? "▲" : "▼"}</span>
            </button>

            {expanded && (
              <ul className="mt-2 space-y-1">
                {activities.map((act, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs" style={{ color: "var(--voya-text-2)" }}>
                    <span>{act.date}</span>
                    <span className="flex-1">{act.name}</span>
                    {act.price !== undefined && (
                      <span style={{ color: "var(--voya-text-3)" }}>
                        {act.price === 0 ? "Free" : `${act.currency ?? "USD"} ${act.price}`}
                      </span>
                    )}
                    {act.source && <SourceBadge source={act.source as string} showTooltip={false} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Loyalty accrual */}
        {totalBonvoyPoints && totalBonvoyPoints > 0 && (
          <div className="mb-3">
            <LoyaltyAccrual
              pointsForStay={totalBonvoyPoints}
              memberTier={memberTier}
              estimatedNights={estimatedNights ?? nights}
            />
          </div>
        )}

        {/* Actions */}
        {!accepted ? (
          <div className="flex gap-2">
            {draftId && guard.canProceed && (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--voya-accent)", color: "#000" }}
              >
                {accepting ? "Accepting…" : "Accept this plan"}
              </button>
            )}
            {!guard.canProceed && (
              <div className="flex-1 py-2.5 rounded-xl text-sm text-center font-medium opacity-50 cursor-not-allowed"
                style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-3)" }}>
                {guard.status === "EXPIRED" ? "Offer expired" : "Not bookable"}
              </div>
            )}
            {draftId && (
              <Link
                href={`/itineraries/${draftId}`}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-center"
                style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-2)" }}
              >
                Full view
              </Link>
            )}
          </div>
        ) : (
          <Link
            href={`/checkout${offer.propertyId ? `?propertyId=${offer.propertyId}` : ""}`}
            className="block w-full py-2.5 rounded-xl font-semibold text-sm text-center transition-opacity hover:opacity-90"
            style={{ background: "var(--voya-amber)", color: "#000" }}
          >
            Proceed to Checkout →
          </Link>
        )}
      </div>
    </article>
  );
}
