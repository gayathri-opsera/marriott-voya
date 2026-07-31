import { describe, it, expect } from "vitest";
import type { UnifiedOffer, SearchResponse } from "@travel/contracts/search";
import type { CreateBookingRequest } from "@travel/contracts/booking";

describe("contract imports", () => {
  it("imports UnifiedOffer shape from @travel/contracts", () => {
    const offer: UnifiedOffer = {
      id: "offer_1",
      provenance: "AMADEUS",
      bookable: true,
      title: "NYC to LAX",
      price: "299.00",
      currency: "USD",
      details: {
        departureAirport: "JFK",
        arrivalAirport: "LAX",
        seatClass: "ECONOMY",
      },
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      freshness: "FRESH",
    };
    expect(offer.bookable).toBe(true);
  });

  it("imports SearchResponse shape from @travel/contracts", () => {
    const response: SearchResponse = {
      offers: [],
      total: 0,
      currency: "USD",
      searchId: "search_1",
    };
    expect(response.total).toBe(0);
  });

  it("imports booking contract shapes from @travel/contracts", () => {
    const request: CreateBookingRequest = {
      offerId: "offer_1",
      bookingType: "FLIGHT",
      passengers: [{ firstName: "Jane", lastName: "Doe", dateOfBirth: new Date("1990-01-01T00:00:00.000Z") }],
      contactEmail: "jane@example.com",
      currency: "USD",
      idempotencyKey: "idem_1",
    };
    expect(request.offerId).toBe("offer_1");
    expect(request.bookingType).toBe("FLIGHT");
  });
});
