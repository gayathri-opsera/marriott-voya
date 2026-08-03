/**
 * Unit tests for Marriott Search Contracts — WO-015
 */

import { describe, it, expect } from "vitest";
import {
  AccommodationSearchRequestSchema,
  AccommodationSearchResponseSchema,
  AccommodationSearchResultSchema,
  GuestCompositionSchema,
  PriceSummarySchema,
  MARRIOTT_FIRST_CLASSIFICATIONS,
} from "../../src/search/accommodation.js";
import {
  validAccommodationRequest,
  geoSearchRequest,
  bonvoyMemberRequest,
  hvmiVillaResult,
  marriottHotelResult,
  partnerApartmentResult,
  unavailablePropertyResult,
  illustrativeFallbackResult,
  validSearchResponse,
  invalidAccommodationRequests,
} from "../fixtures/accommodation-search.js";

describe("AccommodationSearchRequestSchema", () => {
  it("parses a valid text-destination request", () => {
    const r = AccommodationSearchRequestSchema.safeParse(validAccommodationRequest);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sort).toBe("HVMI_FIRST");
      expect(r.data.guests.adults).toBe(2);
    }
  });

  it("parses a geo-based search request", () => {
    const r = AccommodationSearchRequestSchema.safeParse(geoSearchRequest);
    expect(r.success).toBe(true);
  });

  it("parses a Bonvoy member request", () => {
    const r = AccommodationSearchRequestSchema.safeParse(bonvoyMemberRequest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.bonvoyContext?.tierLevel).toBe("PLATINUM");
  });

  it("rejects check-out before check-in", () => {
    const r = AccommodationSearchRequestSchema.safeParse(
      invalidAccommodationRequests.checkOutBeforeCheckIn,
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("checkOut");
    }
  });

  it("rejects check-out equal to check-in", () => {
    expect(
      AccommodationSearchRequestSchema.safeParse(
        invalidAccommodationRequests.checkOutEqualsCheckIn,
      ).success,
    ).toBe(false);
  });

  it("rejects request with zero adults", () => {
    expect(
      AccommodationSearchRequestSchema.safeParse(
        invalidAccommodationRequests.noGuestsAtAll,
      ).success,
    ).toBe(false);
  });

  it("rejects request with no destination or geo", () => {
    expect(
      AccommodationSearchRequestSchema.safeParse(
        invalidAccommodationRequests.noDestinationOrGeo,
      ).success,
    ).toBe(false);
  });

  it("rejects negative guest count", () => {
    expect(
      AccommodationSearchRequestSchema.safeParse(
        invalidAccommodationRequests.negativeGuestCount,
      ).success,
    ).toBe(false);
  });

  it("rejects pageSize > 50", () => {
    expect(
      AccommodationSearchRequestSchema.safeParse(
        invalidAccommodationRequests.pageSizeTooLarge,
      ).success,
    ).toBe(false);
  });
});

describe("AccommodationSearchResultSchema", () => {
  it("parses an HVMI villa result with full fields", () => {
    const r = AccommodationSearchResultSchema.safeParse(hvmiVillaResult);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.hvmiPriority).toBe(true);
      expect(r.data.partnerClassification).toBe("HVMI");
      expect(MARRIOTT_FIRST_CLASSIFICATIONS.has(r.data.partnerClassification)).toBe(true);
      expect(r.data.bookabilityStatus).toBe("BOOKABLE");
      expect(r.data.hvmiCollectionName).toBe("Vineyards & Winery Homes");
    }
  });

  it("parses a Marriott hotel result with discount", () => {
    const r = AccommodationSearchResultSchema.safeParse(marriottHotelResult);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.priceSummary.discountPct).toBe(15);
  });

  it("parses an illustrative/non-bookable partner result", () => {
    const r = AccommodationSearchResultSchema.safeParse(partnerApartmentResult);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bookabilityStatus).toBe("ILLUSTRATIVE");
      expect(MARRIOTT_FIRST_CLASSIFICATIONS.has(r.data.partnerClassification)).toBe(false);
    }
  });

  it("parses an unavailable/expired property", () => {
    const r = AccommodationSearchResultSchema.safeParse(unavailablePropertyResult);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.availabilitySummary.available).toBe(false);
      expect(r.data.bookabilityStatus).toBe("EXPIRED");
    }
  });

  it("parses an illustrative fallback result", () => {
    const r = AccommodationSearchResultSchema.safeParse(illustrativeFallbackResult);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.bookabilityStatus).toBe("ILLUSTRATIVE");
      expect(r.data.hvmiPriority).toBe(false);
    }
  });

  it("rejects result with missing required location.city", () => {
    const r = AccommodationSearchResultSchema.safeParse({
      ...hvmiVillaResult,
      location: { country: "IT" },
    });
    expect(r.success).toBe(false);
  });
});

describe("AccommodationSearchResponseSchema", () => {
  it("parses a valid response with mixed results", () => {
    const r = AccommodationSearchResponseSchema.safeParse(validSearchResponse);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.results).toHaveLength(3);
      expect(r.data.pagination.hasNextPage).toBe(false);
      expect(r.data.freshness.label).toBe("FRESH");
      expect(r.data.fallbackDisclosure).toBeTruthy();
    }
  });

  it("rejects a response with missing queryId", () => {
    const r = AccommodationSearchResponseSchema.safeParse({
      ...validSearchResponse,
      queryId: undefined,
    });
    expect(r.success).toBe(false);
  });
});

describe("MARRIOTT_FIRST_CLASSIFICATIONS", () => {
  it("includes all primary Marriott tiers", () => {
    expect(MARRIOTT_FIRST_CLASSIFICATIONS.has("HVMI")).toBe(true);
    expect(MARRIOTT_FIRST_CLASSIFICATIONS.has("MARRIOTT_LUXURY")).toBe(true);
    expect(MARRIOTT_FIRST_CLASSIFICATIONS.has("MARRIOTT_PREMIUM")).toBe(true);
    expect(MARRIOTT_FIRST_CLASSIFICATIONS.has("MARRIOTT_SELECT")).toBe(true);
    expect(MARRIOTT_FIRST_CLASSIFICATIONS.has("MARRIOTT_PARTNER")).toBe(true);
  });

  it("excludes non-Marriott", () => {
    expect(MARRIOTT_FIRST_CLASSIFICATIONS.has("NON_MARRIOTT")).toBe(false);
    expect(MARRIOTT_FIRST_CLASSIFICATIONS.has("BONVOY_TOURS")).toBe(false);
  });
});
