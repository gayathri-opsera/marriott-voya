/**
 * Itinerary Actions — WOREF-032 (Abandon/Cancel Itinerary)
 * Provides accept, abandon, and status-transition helpers for itinerary drafts.
 */

export type ItineraryAction = "accept" | "abandon";

export interface ItineraryActionResult {
  ok: boolean;
  status?: string;
  error?: string;
}

/**
 * Accept an itinerary draft, moving it to ACCEPTED status.
 * This does NOT book — it signals user intent and triggers the checkout flow.
 */
export async function acceptItinerary(draftId: string): Promise<ItineraryActionResult> {
  try {
    const res = await fetch(`/api/v1/ai/itineraries/${draftId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, string>;
      return { ok: false, error: body["message"] ?? `Accept failed: ${res.status}` };
    }
    const data = await res.json() as { status?: string };
    return { ok: true, status: data.status ?? "ACCEPTED" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Abandon an itinerary draft, moving it to ABANDONED/CANCELLED status.
 * The draft is preserved for audit but excluded from active listings.
 */
export async function abandonItinerary(draftId: string, reason?: string): Promise<ItineraryActionResult> {
  try {
    const res = await fetch(`/api/v1/ai/itineraries/${draftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ABANDONED", abandonReason: reason ?? "user_cancelled" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, string>;
      return { ok: false, error: body["message"] ?? `Abandon failed: ${res.status}` };
    }
    const data = await res.json() as { status?: string };
    return { ok: true, status: data.status ?? "ABANDONED" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/** Labels used in the UI to explain why a trip was cancelled */
export const ABANDON_REASONS: Array<{ value: string; label: string }> = [
  { value: "dates_changed",    label: "My dates changed" },
  { value: "found_better",     label: "Found a better option" },
  { value: "price_too_high",   label: "Price was too high" },
  { value: "changed_my_mind",  label: "Changed my mind" },
  { value: "user_cancelled",   label: "Other reason" },
];
