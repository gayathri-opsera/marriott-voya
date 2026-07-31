import type { SearchResponse } from "@travel/contracts/search";
import { bookableFlightOffer, illustrativeHotelOffer, makeOffer } from "./offer";

export function makeSearchResponse(overrides: Partial<SearchResponse> = {}): SearchResponse {
  return {
    offers: [bookableFlightOffer, illustrativeHotelOffer],
    total: 2,
    currency: "USD",
    searchId: "search_01J9X0Y2Z3A4B5C6D7E8F9G0",
    ...overrides,
  };
}

export { makeOffer, bookableFlightOffer, illustrativeHotelOffer };
