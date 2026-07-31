import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "../../app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("landing page", () => {
  it("renders the hero heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Your journey, intelligently planned" }),
    ).toBeInTheDocument();
  });
});
