import { isBookable } from "./offer";

export function canProceedToCheckout(offer: {
  bookable: boolean;
  expiresAt?: string;
  provenance?: string;
}): { allowed: boolean; reason?: string } {
  if (offer.provenance === "ILLUSTRATIVE") {
    return { allowed: false, reason: "Illustrative offers cannot be booked." };
  }

  if (!offer.bookable) {
    return { allowed: false, reason: "This offer is not available for booking." };
  }

  if (offer.expiresAt && new Date(offer.expiresAt) <= new Date()) {
    return { allowed: false, reason: "This offer has expired." };
  }

  if (!isBookable(offer as Parameters<typeof isBookable>[0])) {
    return { allowed: false, reason: "This offer is no longer bookable." };
  }

  return { allowed: true };
}
