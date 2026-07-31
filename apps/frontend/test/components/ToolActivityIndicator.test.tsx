/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolActivityIndicator } from "../../components/assistant/ToolActivityIndicator";

describe("ToolActivityIndicator", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(
      <ToolActivityIndicator toolName="search_flights" isActive={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows tool label and aria-live when active", () => {
    render(<ToolActivityIndicator toolName="search_hotels" isActive />);
    const indicator = screen.getByTestId("tool-activity-indicator");
    expect(indicator).toHaveAttribute("aria-live", "polite");
    expect(indicator).toHaveAttribute("aria-label", "Looking up hotels…");
    expect(screen.getByText("Looking up hotels…")).toBeInTheDocument();
  });
});
