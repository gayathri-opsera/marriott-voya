import type { Itinerary, ItineraryItem } from "@travel/contracts/booking";
import { bookableFlightOffer } from "./offer";

const defaultItem: ItineraryItem = {
  itemId: "item_01J9X0Y2Z3A4B5C6D7E8F9G0H1",
  bookingId: "book_01J9X0Y2Z3A4B5C6D7E8F9G0H3",
  bookingType: "FLIGHT",
  status: "CONFIRMED",
  offer: bookableFlightOffer,
  totalAmount: "450.00",
  currency: "USD",
  createdAt: "2099-06-14T20:00:00.000Z",
};

export function makeItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  const items = overrides.items ?? [defaultItem];
  return {
    itineraryId: "itin_01J9X0Y2Z3A4B5C6D7E8F9G0H1",
    userId: "user_01J9X0Y2Z3A4B5C6D7E8F9G0H1",
    title: "Summer Trip to London",
    items,
    totalAmount: "450.00",
    currency: "USD",
    createdAt: "2099-06-14T20:00:00.000Z",
    updatedAt: "2099-06-14T20:00:00.000Z",
    ...overrides,
  };
}
