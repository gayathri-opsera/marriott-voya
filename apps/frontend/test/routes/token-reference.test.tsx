/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TokenReferencePage from "../../app/design-system/tokens/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("token reference page", () => {
  it("renders token categories", () => {
    render(<TokenReferencePage />);
    expect(screen.getByRole("heading", { name: "Design Tokens" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "surface" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "text" })).toBeInTheDocument();
  });

  it("shows token rows with css variables", () => {
    render(<TokenReferencePage />);
    expect(screen.getByText("surface-default")).toBeInTheDocument();
    expect(screen.getByText("--color-surface-default")).toBeInTheDocument();
    expect(screen.getByText("brand-primary")).toBeInTheDocument();
  });
});
