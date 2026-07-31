import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../../src/primitives/Badge";
import { renderWithProviders } from "../utils/render";

describe("Badge", () => {
  it("renders children", () => {
    renderWithProviders(<Badge>Confirmed</Badge>);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("applies semantic provenance variant", () => {
    renderWithProviders(<Badge variant="provenance-amadeus">Amadeus</Badge>);
    expect(screen.getByText("Amadeus").className).toContain("text-brand-primary");
  });

  it("applies freshness variant", () => {
    renderWithProviders(<Badge variant="freshness-stale">Stale</Badge>);
    expect(screen.getByText("Stale").className).toContain("text-warning");
  });
});
