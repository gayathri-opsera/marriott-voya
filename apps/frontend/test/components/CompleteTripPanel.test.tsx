import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompleteTripPanel } from "../../components/property/CompleteTripPanel";

describe("CompleteTripPanel", () => {
  it("renders the heading and destination", () => {
    render(<CompleteTripPanel destination="Tuscany" />);
    expect(screen.getByRole("button", { name: /Complete your trip/i })).toBeTruthy();
  });

  it("shows suggestions when expanded", () => {
    render(<CompleteTripPanel destination="Tuscany" />);
    expect(screen.getByText(/Lucca City Walls Walk/i)).toBeTruthy();
  });

  it("collapses when header is clicked", () => {
    render(<CompleteTripPanel destination="Tuscany" />);
    // Initially expanded
    expect(screen.getByText(/Lucca City Walls Walk/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Complete your trip/i }));
    expect(screen.queryByText(/Lucca City Walls Walk/i)).toBeNull();
  });

  it("filters suggestions by category", () => {
    render(<CompleteTripPanel destination="Tuscany" />);
    // click Tours filter
    const tourBtn = screen.getByRole("button", { name: /^Tours$/i });
    fireEvent.click(tourBtn);
    // Chianti Wine Tour should show
    expect(screen.getByText(/Chianti Wine Tour/i)).toBeTruthy();
    // Lucca Walls (attraction type) should not
    expect(screen.queryByText(/Lucca City Walls Walk/i)).toBeNull();
  });

  it("marks a suggestion as added and calls callback", () => {
    const onAdd = vi.fn();
    render(<CompleteTripPanel destination="Tuscany" onAddToItinerary={onAdd} />);
    // Use aria-label matching: aria-label="Add ... to itinerary"
    const addBtns = screen.getAllByRole("button", { name: /Add .+ to itinerary/i });
    fireEvent.click(addBtns[0]);
    expect(onAdd).toHaveBeenCalledTimes(1);
    // Button should now say "Added to itinerary"
    expect(screen.getAllByRole("button", { name: /Added to itinerary/i }).length).toBeGreaterThan(0);
  });

  it("shows date range when checkIn/checkOut provided", () => {
    render(
      <CompleteTripPanel
        destination="Tuscany"
        checkIn="2026-09-10"
        checkOut="2026-09-14"
      />
    );
    expect(screen.getByText(/2026-09-10/i)).toBeTruthy();
  });
});
