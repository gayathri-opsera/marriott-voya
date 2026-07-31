import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../utils/render";
import { ConfirmationSummary } from "@/components/checkout/ConfirmationSummary";

describe("ConfirmationSummary", () => {
  it("groups items by source with subtotals", () => {
    renderWithProviders(
      <ConfirmationSummary
        bookingRef="BK-12345"
        items={[
          { title: "Flight JFK → LHR", source: "AMADEUS", price: "450.00", currency: "USD" },
          { title: "Hotel Paris", source: "RAPIDAPI", price: "120.00", currency: "USD" },
        ]}
      />,
    );

    expect(screen.getByText("BK-12345")).toBeInTheDocument();
    expect(screen.getByText("Subtotal (AMADEUS)")).toBeInTheDocument();
    expect(screen.getByText("Subtotal (RAPIDAPI)")).toBeInTheDocument();
    expect(screen.getByText("Grand total")).toBeInTheDocument();
    expect(screen.getByText("$570.00")).toBeInTheDocument();
  });

  it("formats individual item prices", () => {
    renderWithProviders(
      <ConfirmationSummary
        bookingRef="BK-999"
        items={[{ title: "Car rental", source: "RAPIDAPI", price: "89.50", currency: "USD" }]}
      />,
    );

    expect(screen.getAllByText("$89.50").length).toBeGreaterThan(0);
  });
});
