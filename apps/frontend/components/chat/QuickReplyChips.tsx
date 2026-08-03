"use client";

/**
 * QuickReplyChips — WOREF-006
 * Suggested reply buttons rendered below assistant messages.
 * Helps guide users through the booking flow with one-tap prompts.
 */

import React from "react";

export interface QuickReply {
  id: string;
  label: string;
  /** Optional message to send — defaults to label */
  message?: string;
  /** Intent hint for analytics */
  intent?: string;
}

interface QuickReplyChipsProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  disabled?: boolean;
}

export function QuickReplyChips({ replies, onSelect, disabled = false }: QuickReplyChipsProps): React.JSX.Element | null {
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Suggested replies">
      {replies.map((reply) => (
        <button
          key={reply.id}
          onClick={() => !disabled && onSelect(reply)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:border-transparent disabled:opacity-40"
          style={{
            border: "1px solid var(--voya-accent)",
            color: "var(--voya-accent)",
            background: "transparent",
          }}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}

/** Standard quick replies for the main booking flow */
export const BOOKING_FLOW_REPLIES: QuickReply[] = [
  { id: "book-now",        label: "Book this villa",         intent: "CHECKOUT_STARTED" },
  { id: "more-options",   label: "Show me more options",    intent: "SEARCH_STARTED" },
  { id: "add-activities", label: "Add activities",          intent: "ITINERARY_EDIT" },
  { id: "check-flights",  label: "Check flights",           intent: "FLIGHT_SEARCH" },
  { id: "different-dates",label: "Change dates",            intent: "DATE_CHANGE" },
];

export const DESTINATION_REPLIES: QuickReply[] = [
  { id: "lucca",   label: "🇮🇹 Lucca, Italy",     message: "Find Homes & Villas near Lucca, Italy" },
  { id: "paris",   label: "🇫🇷 Paris, France",     message: "Search Marriott properties in Paris" },
  { id: "kyoto",   label: "🇯🇵 Kyoto, Japan",      message: "Find Marriott villas in Kyoto" },
  { id: "santorini",label: "🇬🇷 Santorini, Greece", message: "Show HVMI villas in Santorini" },
  { id: "maldives",label: "🇲🇻 Maldives",          message: "Find Marriott resorts in the Maldives" },
];
