import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SiteHeader } from "../../components/layout/SiteHeader";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

vi.mock("../../lib/session", () => ({
  isAuthenticated: vi.fn(() => false),
  getSession: vi.fn(() => Promise.resolve({ accessToken: null, userId: null })),
  clearSession: vi.fn(),
}));

describe("SiteHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders desktop navigation links", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: "Trips" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Assistant" })).toHaveAttribute("href", "/assistant");
  });

  it("shows Login and Register when unauthenticated", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/auth/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/auth/register");
  });

  it("hamburger button has aria-expanded and aria-controls", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const menuButton = screen.getByRole("button", { name: "Open navigation menu" });
    expect(menuButton).toHaveAttribute("aria-controls", "mobile-nav");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });
});
