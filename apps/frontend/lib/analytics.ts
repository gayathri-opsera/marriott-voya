/**
 * Booking conversion funnel events — WOREF-047
 * These events mirror the 5-step funnel:
 *   IMPRESSION → SEARCH → OFFER_VIEWED → CHECKOUT_STARTED → BOOKING_CONFIRMED
 */
export const JOURNEY_EVENTS = {
  // Awareness
  LANDING_VIEWED:            "LANDING_VIEWED",
  ENTRY_CARD_CLICKED:        "ENTRY_CARD_CLICKED",
  // Consideration
  SEARCH_STARTED:            "search_started",
  QUICK_SEARCH_SUBMITTED:    "QUICK_SEARCH_SUBMITTED",
  SEARCH_RESULTS_VIEWED:     "search_results_viewed",
  OFFER_VIEWED:              "offer_viewed",
  PRICE_HOLD_CREATED:        "price_hold_created",
  // Checkout funnel
  CHECKOUT_STARTED:          "checkout_started",
  CHECKOUT_STEP_COMPLETED:   "checkout_step_completed",
  TRAVELLER_DETAILS_ENTERED: "traveller_details_entered",
  PAYMENT_INITIATED:         "payment_initiated",
  BOOKING_CONFIRMED:         "booking_confirmed",
  // Drop-off
  CHECKOUT_ABANDONED:        "checkout_abandoned",
  PRICE_HOLD_EXPIRED:        "price_hold_expired",
  OFFER_EXPIRED:             "offer_expired",
  // AI assistant
  ASSISTANT_MESSAGE_SENT:    "assistant_message_sent",
  ITINERARY_GENERATED:       "itinerary_generated",
  ITINERARY_ACCEPTED:        "itinerary_accepted",
  // Loyalty
  BONVOY_POINTS_VIEWED:      "bonvoy_points_viewed",
  BONVOY_REDEMPTION_CLICKED: "bonvoy_redemption_clicked",
} as const;

export function trackEvent(
  name: string,
  props: Record<string, string | number | boolean>,
): void {
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, props }),
  }).catch(() => {
    // Fire-and-forget — analytics must not block UX
  });
}
