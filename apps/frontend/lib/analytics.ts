export const JOURNEY_EVENTS = {
  SEARCH_STARTED: "search_started",
  OFFER_VIEWED: "offer_viewed",
  CHECKOUT_STARTED: "checkout_started",
  BOOKING_CONFIRMED: "booking_confirmed",
  ASSISTANT_MESSAGE_SENT: "assistant_message_sent",
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
