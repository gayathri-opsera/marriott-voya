import { describe, it, expect } from "vitest";
import {
  isBookable,
  getProvenanceLabel,
  getProvenanceBadgeVariant,
} from "../../lib/domain/offer";
import { bookableFlightOffer, illustrativeHotelOffer } from "../fixtures/searchResponse";

describe("offer domain", () => {
  it("returns true for a bookable AMADEUS offer that has not expired", () => {
    expect(isBookable(bookableFlightOffer)).toBe(true);
  });

  it("returns false for ILLUSTRATIVE offers", () => {
    expect(isBookable(illustrativeHotelOffer)).toBe(false);
  });

  it("returns false when bookable is false", () => {
    expect(isBookable({ bookable: false, provenance: "AMADEUS" })).toBe(false);
  });

  it("returns false when the offer has expired", () => {
    expect(
      isBookable({
        bookable: true,
        provenance: "AMADEUS",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
    ).toBe(false);
  });

  it("maps provenance to label and badge variant", () => {
    expect(getProvenanceLabel("AMADEUS")).toBe("Amadeus");
    expect(getProvenanceBadgeVariant("ILLUSTRATIVE")).toBe("provenance-illustrative");
  });
});
