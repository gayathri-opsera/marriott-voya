/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DayView, segmentFromItem } from "../../components/trips/DayView";
import { makeItinerary } from "../fixtures/itinerary";
import { illustrativeHotelOffer } from "../fixtures/offer";

describe("DayView", () => {
  it("renders day heading with formatted date", () => {
    render(
      <DayView
        date="2099-06-15"
        segments={[
          {
            id: "seg-1",
            type: "FLIGHT",
            time: "9:00 AM",
            description: "JFK → LHR",
          },
        ]}
      />,
    );
    expect(screen.getByTestId("day-view")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("shows substituted badge for substitution segments", () => {
    render(
      <DayView
        date="2099-06-15"
        segments={[
          {
            id: "seg-2",
            type: "HOTEL",
            time: "3:00 PM",
            description: "Example Hotel",
            isSubstitution: true,
          },
        ]}
      />,
    );
    expect(screen.getByTestId("substituted-badge")).toHaveTextContent("Substituted");
  });

  it("segmentFromItem marks illustrative offers as substitutions", () => {
    const itinerary = makeItinerary({
      items: [
        {
          itemId: "item_sub",
          bookingId: "book_sub",
          bookingType: "HOTEL",
          status: "CONFIRMED",
          offer: illustrativeHotelOffer,
          totalAmount: "120.00",
          currency: "USD",
          createdAt: "2099-06-15T15:00:00.000Z",
        },
      ],
    });
    const segment = segmentFromItem(itinerary.items[0]!);
    expect(segment.isSubstitution).toBe(true);
    expect(segment.loyaltyIllustrative).toBe(true);
  });
});
