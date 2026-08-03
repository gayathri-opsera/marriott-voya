import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsList } from "../../components/results/ResultsList";
import { bookableFlightOffer } from "../fixtures/searchResponse";

describe("ResultsList", () => {
  it("shows skeleton cards when loading with skeleton=true", () => {
    render(<ResultsList offers={[]} isLoading skeleton />);
    const list = screen.getByLabelText("Search results");
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(list.children).toHaveLength(4);
  });

  it("renders OfferCard components when results are loaded", () => {
    render(
      <ResultsList
        offers={[bookableFlightOffer]}
        isLoading={false}
        skeleton={false}
      />,
    );
    expect(screen.getByLabelText("Search results")).toBeInTheDocument();
    expect(screen.getByText(bookableFlightOffer.title)).toBeInTheDocument();
  });

  it("returns null for empty results when not loading", () => {
    const { container } = render(
      <ResultsList offers={[]} isLoading={false} skeleton={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows error message when error prop is set", () => {
    render(
      <ResultsList
        offers={[]}
        isLoading={false}
        skeleton={false}
        error="Search failed"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Search failed");
  });
});
