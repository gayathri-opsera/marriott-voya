"use client";

import * as React from "react";
import type { Itinerary } from "@travel/contracts/booking";
import { DayView, segmentsFromItems } from "./DayView";

export interface ItineraryViewProps {
  itinerary: Itinerary;
}

export function ItineraryView({ itinerary }: ItineraryViewProps): React.JSX.Element {
  const dayMap = segmentsFromItems(itinerary.items);
  const sortedDays = [...dayMap.keys()].sort();

  if (sortedDays.length === 0) {
    return (
      <p className="text-sm text-text-muted" data-testid="itinerary-empty">
        No itinerary segments yet.
      </p>
    );
  }

  return (
    <div data-testid="itinerary-view">
      {sortedDays.map((date) => (
        <DayView key={date} date={date} segments={dayMap.get(date)!} />
      ))}
    </div>
  );
}
