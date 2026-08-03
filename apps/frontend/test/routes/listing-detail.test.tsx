import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ListingDetailPage from "../../app/listings/[id]/page";
import { bookableFlightOffer, illustrativeHotelOffer } from "../fixtures/searchResponse";

const apiGet = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "offer_01J9X0Y2Z3A4B5C6D7E8F9G0H1" }),
}));

vi.mock("../../lib/api/client", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
}));

describe("listing detail page", () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it("shows loading state initially", () => {
    apiGet.mockReturnValue(new Promise(() => {}));
    render(<ListingDetailPage />);
    expect(screen.getByTestId("state-loading")).toBeInTheDocument();
  });

  it("renders offer details for a bookable offer", async () => {
    apiGet.mockResolvedValue(bookableFlightOffer);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(bookableFlightOffer.title)).toBeInTheDocument();
    });
    expect(screen.getByText("$450.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book Now" })).toBeInTheDocument();
  });

  it("hides Book Now for illustrative offers", async () => {
    apiGet.mockResolvedValue(illustrativeHotelOffer);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(illustrativeHotelOffer.title)).toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: "Book Now" })).not.toBeInTheDocument();
    expect(screen.getByText(/Illustrative offers cannot be booked/)).toBeInTheDocument();
  });
});
