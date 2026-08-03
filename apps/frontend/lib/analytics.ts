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
  // Offer presented — WOREF-009
  OFFER_PRESENTED:           "offer_presented",
  OFFER_CARD_IMPRESSION:     "offer_card_impression",
  OFFER_CTA_CLICKED:         "offer_cta_clicked",
  OFFER_EXPIRED_SHOWN:       "offer_expired_shown",
  SEARCH_FILTERS_CHANGED:    "search_filters_changed",
  SEARCH_SORT_CHANGED:       "search_sort_changed",
  SEARCH_RESULT_COUNT:       "search_result_count",
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

/**
 * Track an offer impression (WOREF-009).
 * Called when an AccommodationResultCard becomes visible in the viewport.
 */
export function trackOfferPresented(params: {
  propertyId: string;
  provenance: string;
  hvmiPriority: boolean;
  positionIndex: number;
  priceUSD?: number;
}): void {
  trackEvent(JOURNEY_EVENTS.OFFER_PRESENTED, {
    propertyId: params.propertyId,
    provenance: params.provenance,
    hvmiPriority: params.hvmiPriority,
    positionIndex: params.positionIndex,
    ...(params.priceUSD !== undefined ? { priceUSD: params.priceUSD } : {}),
  });
}

/**
 * Track a search result set (WOREF-053 — search performance budget).
 */
export function trackSearchResults(params: {
  destination: string;
  totalResults: number;
  hvmiCount: number;
  latencyMs: number;
  cacheStatus: string;
}): void {
  trackEvent(JOURNEY_EVENTS.SEARCH_RESULT_COUNT, {
    destination: params.destination,
    totalResults: params.totalResults,
    hvmiCount: params.hvmiCount,
    latencyMs: params.latencyMs,
    cacheStatus: params.cacheStatus,
  });
}
