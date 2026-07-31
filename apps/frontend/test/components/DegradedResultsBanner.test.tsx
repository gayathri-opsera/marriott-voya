/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DegradedResultsBanner } from "../../components/search/DegradedResultsBanner";

describe("DegradedResultsBanner", () => {
  it("renders nothing when all suppliers are ok", () => {
    const { container } = render(
      <DegradedResultsBanner supplierStatuses={[{ name: "Amadeus", status: "ok" }]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows banner for partial supplier", () => {
    render(
      <DegradedResultsBanner
        supplierStatuses={[{ name: "RapidAPI Hotels", status: "partial" }]}
      />,
    );
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Results from RapidAPI Hotels are incomplete");
  });

  it("can be dismissed", async () => {
    const user = userEvent.setup();
    render(
      <DegradedResultsBanner supplierStatuses={[{ name: "Amadeus", status: "down" }]} />,
    );
    await user.click(screen.getByLabelText("Dismiss degraded results notice"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
