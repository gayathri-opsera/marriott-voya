/**
 * Offer Expiry Guard — WOREF-023 (Gate Expired Offer Checkout)
 *
 * Validates that an offer is still bookable before proceeding to checkout.
 * Called at: search → checkout transition, and at checkout mount.
 *
 * Rules:
 * - Offer with bookabilityStatus !== "BOOKABLE" → blocked
 * - Offer whose expiresAt is in the past → expired
 * - ILLUSTRATIVE offers → never bookable (always blocked)
 * - Missing/unknown offers → blocked (fail-safe)
 */

export type OfferGuardStatus =
  | "VALID"
  | "EXPIRED"
  | "NOT_BOOKABLE"
  | "ILLUSTRATIVE"
  | "UNKNOWN";

export interface OfferGuardResult {
  status: OfferGuardStatus;
  canProceed: boolean;
  reason?: string;
  /** Suggested user-facing action */
  action?: "re-search" | "contact-support" | "none";
}

export interface GuardableOffer {
  id?: string;
  bookable?: boolean;
  expiresAt?: string | null;
  provenance?: string;
  bookabilityStatus?: string;
}

export function guardOffer(offer: GuardableOffer | null | undefined): OfferGuardResult {
  if (!offer) {
    return {
      status: "UNKNOWN",
      canProceed: false,
      reason: "Offer not found or could not be loaded.",
      action: "re-search",
    };
  }

  // ILLUSTRATIVE offers are never bookable
  if (offer.provenance === "ILLUSTRATIVE" || offer.bookabilityStatus === "ILLUSTRATIVE") {
    return {
      status: "ILLUSTRATIVE",
      canProceed: false,
      reason: "This offer is a demo placeholder and cannot be booked.",
      action: "re-search",
    };
  }

  // Explicit bookabilityStatus check (new AccommodationSearchResponse)
  if (offer.bookabilityStatus && offer.bookabilityStatus !== "BOOKABLE") {
    if (offer.bookabilityStatus === "EXPIRED") {
      return { status: "EXPIRED", canProceed: false, reason: "This offer has expired. Please search again.", action: "re-search" };
    }
    return {
      status: "NOT_BOOKABLE",
      canProceed: false,
      reason: `This offer is currently ${offer.bookabilityStatus.toLowerCase().replace("_", " ")}.`,
      action: "re-search",
    };
  }

  // Legacy bookable flag
  if (offer.bookable === false) {
    return {
      status: "NOT_BOOKABLE",
      canProceed: false,
      reason: "This offer is not available for online booking.",
      action: "contact-support",
    };
  }

  // Expiry timestamp check
  if (offer.expiresAt) {
    const expiresAt = new Date(offer.expiresAt);
    if (!isNaN(expiresAt.getTime()) && expiresAt <= new Date()) {
      return {
        status: "EXPIRED",
        canProceed: false,
        reason: "This offer has expired. Prices and availability may have changed.",
        action: "re-search",
      };
    }
  }

  return { status: "VALID", canProceed: true, action: "none" };
}

/** Returns seconds until offer expires, or null if no expiry */
export function secondsUntilExpiry(offer: GuardableOffer | null | undefined): number | null {
  if (!offer?.expiresAt) return null;
  const expiresAt = new Date(offer.expiresAt);
  if (isNaN(expiresAt.getTime())) return null;
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}

/** Returns true if offer expires within `warningThresholdSeconds` */
export function isExpiringSoon(
  offer: GuardableOffer | null | undefined,
  warningThresholdSeconds = 300,
): boolean {
  const secs = secondsUntilExpiry(offer);
  return secs !== null && secs > 0 && secs <= warningThresholdSeconds;
}
