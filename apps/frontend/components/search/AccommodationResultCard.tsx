"use client";

/**
 * AccommodationResultCard — WOREF-017
 * Marriott-branded search result card for HVMI villas, Marriott hotels, and partner properties.
 * Displays: provenance badge, price, Bonvoy points, bookability, expiry countdown.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { isExpiringSoon, guardOffer } from "../../lib/offer-guard.js";

export interface AccommodationResult {
  propertyId: string;
  name: string;
  propertyType: string;
  partnerClassification?: string;
  hvmiPriority?: boolean;
  hvmiCollectionName?: string;
  location: {
    city?: string;
    regionLabel?: string;
    country?: string;
  };
  amenities?: string[];
  priceSummary?: {
    nightlyRate: string;
    currency: string;
    discountPct?: number;
  };
  availabilitySummary?: {
    available: boolean;
    roomsLeft?: number;
  };
  bonvoySummary?: {
    pointsForStay: number;
    pointsPerDollar?: number;
  };
  images?: Array<{ url: string; altText?: string }>;
  bookabilityStatus?: string;
  provenance?: string;
  expiresAt?: string;
  onSelectOffer?: (propertyId: string) => void;
}

const PROVENANCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  HVMI:            { bg: "#d4a84b20", text: "#d4a84b", label: "Homes & Villas by Marriott" },
  MARRIOTT_DIRECT: { bg: "#c1440e20", text: "#c1440e", label: "Marriott" },
  BONVOY_TOURS:    { bg: "#7c3aed20", text: "#7c3aed", label: "Bonvoy Tours" },
  ILLUSTRATIVE:    { bg: "#6b728020", text: "#6b7280", label: "Demo" },
};

function ProvenanceBadge({ provenance }: { provenance?: string }): React.JSX.Element | null {
  if (!provenance) return null;
  const conf = PROVENANCE_COLORS[provenance] ?? { bg: "#6b728020", text: "#6b7280", label: provenance };
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: conf.bg, color: conf.text }}>
      {conf.label}
    </span>
  );
}

export function AccommodationResultCard({
  propertyId,
  name,
  propertyType,
  hvmiPriority,
  hvmiCollectionName,
  location,
  amenities = [],
  priceSummary,
  bonvoySummary,
  availabilitySummary,
  images = [],
  bookabilityStatus,
  provenance,
  expiresAt,
  onSelectOffer,
}: AccommodationResult): React.JSX.Element {
  const guard = guardOffer({ bookabilityStatus, provenance, expiresAt });
  const expiringSoon = isExpiringSoon({ expiresAt });
  const heroImage = images[0]?.url ?? `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80`;

  return (
    <article
      className="rounded-2xl overflow-hidden transition-shadow hover:shadow-lg"
      style={{ border: "1px solid var(--voya-border)", background: "var(--voya-surface-1)" }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <Image
          src={heroImage}
          alt={images[0]?.altText ?? name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={heroImage.includes("unsplash.com")}
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <ProvenanceBadge provenance={provenance} />
          {hvmiPriority && hvmiCollectionName && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-black/60 text-white">
              {hvmiCollectionName}
            </span>
          )}
        </div>
        {expiringSoon && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium bg-orange-500 text-white">
            ⏱ Expiring soon
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h2 className="font-semibold text-sm leading-tight" style={{ color: "var(--voya-text-1)" }}>
          {name}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--voya-text-3)" }}>
          {[location.city, location.regionLabel, location.country].filter(Boolean).join(", ")}
        </p>

        {/* Property type */}
        <p className="text-xs mt-1 capitalize" style={{ color: "var(--voya-text-3)" }}>
          {propertyType.toLowerCase().replace("_", " ")}
        </p>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {amenities.slice(0, 3).map((a) => (
              <span key={a} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-3)" }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Price & Points */}
        <div className="flex items-end justify-between mt-3">
          <div>
            {priceSummary && (
              <div>
                <span className="text-lg font-bold" style={{ color: "var(--voya-text-1)" }}>
                  {priceSummary.currency} {Number(priceSummary.nightlyRate).toLocaleString()}
                </span>
                <span className="text-xs ml-1" style={{ color: "var(--voya-text-3)" }}>/night</span>
              </div>
            )}
            {bonvoySummary && (
              <p className="text-xs" style={{ color: "var(--voya-amber)" }}>
                +{bonvoySummary.pointsForStay.toLocaleString()} pts
              </p>
            )}
          </div>
          {availabilitySummary?.roomsLeft && availabilitySummary.roomsLeft <= 3 && (
            <span className="text-xs font-medium text-orange-500">
              {availabilitySummary.roomsLeft} left!
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-3">
          {guard.canProceed ? (
            onSelectOffer ? (
              <button
                onClick={() => onSelectOffer(propertyId)}
                className="w-full py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "var(--voya-accent)", color: "#000" }}
              >
                {hvmiPriority ? "Book this villa" : "Select room"}
              </button>
            ) : (
              <Link
                href={`/checkout?propertyId=${propertyId}`}
                className="block w-full py-2 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-90"
                style={{ background: "var(--voya-accent)", color: "#000" }}
              >
                {hvmiPriority ? "Book this villa" : "Select room"}
              </Link>
            )
          ) : (
            <button
              disabled
              className="w-full py-2 rounded-xl text-sm font-semibold opacity-40 cursor-not-allowed"
              style={{ background: "var(--voya-surface-2)", color: "var(--voya-text-3)" }}
            >
              {guard.status === "EXPIRED" ? "Offer expired" : "Not available"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
