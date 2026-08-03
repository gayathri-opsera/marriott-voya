/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "../../app/page";
import SearchPage from "../../app/search/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("q=London"),
}));

describe("responsive layouts", () => {
  it("landing page renders at 375px mobile viewport", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event("resize"));
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Your journey, intelligently planned" }),
    ).toBeInTheDocument();
  });

  it("landing page renders at 1536px desktop viewport", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1536 });
    window.dispatchEvent(new Event("resize"));
    render(<HomePage />);
    expect(screen.getByLabelText("Quick search")).toBeInTheDocument();
  });

  it("search page shows filter panel on desktop layout", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1536 });
    render(<SearchPage />);
    expect(screen.getByLabelText("Search filters")).toBeInTheDocument();
  });

  it("search page shows stacked filters on mobile", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
    render(<SearchPage />);
    const filterPanel = screen.getByLabelText("Search filters");
    expect(filterPanel.className).toMatch(/w-full/);
  });
});
