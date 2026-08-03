"use client";

/**
 * SourceBadge — WOREF-021
 * Attribution badges that identify the data source for search results.
 * WCAG 2.1 AA compliant with tooltip for full source description.
 */

import React, { useState } from "react";

export type DataSource =
  | "HVMI"
  | "MARRIOTT_DIRECT"
  | "BONVOY_TOURS"
  | "AMADEUS"
  | "SKYSCANNER"
  | "BOOKING_COM"
  | "ILLUSTRATIVE";

const SOURCE_CONFIG: Record<DataSource, { label: string; fullName: string; color: string; icon: string }> = {
  HVMI:           { label: "HVMI",         fullName: "Homes & Villas by Marriott Bonvoy",    color: "#d4a84b", icon: "🏡" },
  MARRIOTT_DIRECT:{ label: "Marriott",     fullName: "Marriott Bonvoy Direct",                color: "#c1440e", icon: "🏨" },
  BONVOY_TOURS:   { label: "Bonvoy Tours", fullName: "Marriott Bonvoy Tours & Activities",    color: "#7c3aed", icon: "🎭" },
  AMADEUS:        { label: "Amadeus",      fullName: "Amadeus Travel Platform",               color: "#0ea5e9", icon: "✈️" },
  SKYSCANNER:     { label: "Skyscanner",   fullName: "Skyscanner Flight Comparison",          color: "#0770e3", icon: "✈️" },
  BOOKING_COM:    { label: "Booking.com",  fullName: "Booking.com Accommodation",             color: "#003580", icon: "🏨" },
  ILLUSTRATIVE:   { label: "Demo",         fullName: "Illustrative data — not real inventory", color: "#6b7280", icon: "ℹ️" },
};

interface SourceBadgeProps {
  source: DataSource | string;
  showTooltip?: boolean;
}

export function SourceBadge({ source, showTooltip = true }: SourceBadgeProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  const conf = SOURCE_CONFIG[source as DataSource] ?? { label: source, fullName: source, color: "#6b7280", icon: "📍" };

  return (
    <div className="relative inline-flex items-center">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium cursor-default"
        style={{ background: conf.color + "20", color: conf.color }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Data source: ${conf.fullName}`}
      >
        <span aria-hidden="true">{conf.icon}</span>
        {conf.label}
      </span>

      {showTooltip && hovered && (
        <div
          className="absolute bottom-full left-0 mb-1 px-2 py-1 rounded text-xs whitespace-nowrap z-50 shadow-lg"
          style={{ background: "var(--voya-surface-1)", border: "1px solid var(--voya-border)", color: "var(--voya-text-2)" }}
          role="tooltip"
        >
          {conf.fullName}
        </div>
      )}
    </div>
  );
}
