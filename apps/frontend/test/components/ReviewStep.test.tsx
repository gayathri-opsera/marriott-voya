import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../utils/render";
import { ReviewStep } from "@/components/checkout/ReviewStep";

const baseOffer = {
  title: "British Airways JFK → LHR",
  price: "450.00",
  currency: "USD",
  provenance: "AMADEUS",
  bookable: true,
  expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
};

describe("ReviewStep", () => {
  it("renders offer summary with formatted price", () => {
    renderWithProviders(<ReviewStep offer={baseOffer} onContinue={() => {}} />);
    expect(screen.getByText(baseOffer.title)).toBeInTheDocument();
    expect(screen.getByText("$450.00")).toBeInTheDocument();
    expect(screen.getByText("AMADEUS")).toBeInTheDocument();
  });

  it("shows disclosure banner for illustrative offers", () => {
    renderWithProviders(
      <ReviewStep
        offer={{ ...baseOffer, provenance: "ILLUSTRATIVE", bookable: false }}
        onContinue={() => {}}
      />,
    );
    expect(
      screen.getByText("This is an illustrative offer and cannot be booked"),
    ).toBeInTheDocument();
  });
});
