"use client";

import * as React from "react";
import { Badge } from "@travel/design-system";
import type { ItineraryItem } from "@travel/contracts/booking";
import { LoyaltyAccrual } from "./LoyaltyAccrual";

export interface TripSegment {
  id: string;
  type: "FLIGHT" | "HOTEL" | "CAR";
  time: string;
  description: string;
  isSubstitution?: boolean;
  loyaltyPoints?: number;
  loyaltyIllustrative?: boolean;
  programName?: string;
}

export interface DayViewProps {
  date: string;
  segments: TripSegment[];
}

const TYPE_ICONS: Record<TripSegment["type"], string> = {
  FLIGHT: "✈",
  HOTEL: "🏨",
  CAR: "🚗",
};

function segmentFromItem(item: ItineraryItem): TripSegment {
  const details = item.offer.details;
  let time = new Date(item.createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  let description = item.offer.title;

  if ("departureTime" in details && details.departureTime) {
    time = new Date(details.departureTime).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if ("hotelName" in details) {
    description = `${details.hotelName}${details.roomType ? ` — ${details.roomType}` : ""}`;
  }

  return {
    id: item.itemId,
    type: item.bookingType,
    time,
    description,
    isSubstitution: item.offer.provenance === "ILLUSTRATIVE",
    loyaltyPoints: Math.round(parseFloat(item.totalAmount) * 10),
    loyaltyIllustrative: item.offer.provenance === "ILLUSTRATIVE",
    programName: "Bonvoy",
  };
}

export function segmentsFromItems(items: ItineraryItem[]): Map<string, TripSegment[]> {
  const byDay = new Map<string, TripSegment[]>();

  for (const item of items) {
    const details = item.offer.details;
    let dateKey = item.createdAt.slice(0, 10);
    if ("departureTime" in details && details.departureTime) {
      dateKey = details.departureTime.slice(0, 10);
    }

    const segments = byDay.get(dateKey) ?? [];
    segments.push(segmentFromItem(item));
    byDay.set(dateKey, segments);
  }

  return byDay;
}

export function DayView({ date, segments }: DayViewProps): React.JSX.Element {
  const heading = new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="mb-6" data-testid="day-view" aria-label={`Itinerary for ${heading}`}>
      <h3 className="mb-3 text-lg font-semibold text-text-primary">{heading}</h3>
      <ol className="space-y-3">
        {segments.map((segment) => (
          <li
            key={segment.id}
            className="flex items-start gap-3 rounded-lg border border-border-default bg-surface-default p-4 shadow-sm"
          >
            <span className="text-xl" aria-hidden>
              {TYPE_ICONS[segment.type]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <time className="text-sm font-medium text-text-secondary">{segment.time}</time>
                {segment.isSubstitution && (
                  <Badge variant="warning" data-testid="substituted-badge">
                    Substituted
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-text-primary">{segment.description}</p>
              {segment.loyaltyPoints != null && segment.programName && (
                <div className="mt-2">
                  <LoyaltyAccrual
                    points={segment.loyaltyPoints}
                    isIllustrative={segment.loyaltyIllustrative ?? false}
                    programName={segment.programName}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export { segmentFromItem };
