import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkipLink } from "../../components/layout/SkipLink";

describe("SkipLink", () => {
  it("renders a link to main content", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("uses sr-only styling with focus visibility", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link.className).toContain("sr-only");
    expect(link.className).toContain("focus:not-sr-only");
  });
});
