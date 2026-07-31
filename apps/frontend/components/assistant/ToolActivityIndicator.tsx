"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

const TOOL_LABELS: Record<string, string> = {
  search_flights: "Searching flights…",
  search_hotels: "Looking up hotels…",
  search_cars: "Finding car rentals…",
  get_weather: "Checking weather…",
  create_itinerary: "Building itinerary…",
};

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? `Running ${toolName.replace(/_/g, " ")}…`;
}

export interface ToolActivityIndicatorProps {
  toolName: string;
  isActive: boolean;
}

export function ToolActivityIndicator({
  toolName,
  isActive,
}: ToolActivityIndicatorProps): React.JSX.Element | null {
  if (!isActive) return null;

  const label = getToolLabel(toolName);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted"
      data-testid="tool-activity-indicator"
    >
      <span
        className={cn(
          "inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent",
        )}
        aria-hidden
      />
      <span>{label}</span>
      <span className="flex gap-1" aria-hidden>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted"
          style={{ animationDelay: "300ms" }}
        />
      </span>
    </div>
  );
}
