import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfferCard } from "../../components/results/OfferCard";
import { bookableFlightOffer, illustrativeHotelOffer } from "../fixtures/searchResponse";

describe("OfferCard", () => {
  it("renders offer title and formatted price", () => {
    render(<OfferCard offer={bookableFlightOffer} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByText(bookableFlightOffer.title)).toBeInTheDocument();
    expect(screen.getByText("$450.00")).toBeInTheDocument();
  });

  it("shows provenance and freshness badges", () => {
    render(<OfferCard offer={bookableFlightOffer} />);
    expect(screen.getByText("Amadeus")).toBeInTheDocument();
    expect(screen.getByText("FRESH")).toBeInTheDocument();
    expect(screen.getByText("Bookable")).toBeInTheDocument();
  });

  it("shows illustrative overlay for non-bookable offers", () => {
    render(<OfferCard offer={illustrativeHotelOffer} />);
    expect(screen.getByText("Illustrative — cannot be booked")).toBeInTheDocument();
    expect(screen.getByText("Not bookable")).toBeInTheDocument();
  });

  it("links to listing detail page", () => {
    render(<OfferCard offer={bookableFlightOffer} />);
    const link = screen.getByRole("link", { name: "View Details" });
    expect(link).toHaveAttribute("href", `/listings/${bookableFlightOffer.id}`);
  });
});
