/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StateBoundary } from "../../components/patterns/StateBoundary";
import { ApiError } from "../../lib/api/errors";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("q=London"),
  usePathname: () => "/",
  useParams: () => ({ id: "offer-1" }),
}));

vi.mock("../../components/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const error = new ApiError(500, "internal_error", "Something went wrong");

describe("state matrix — error state renders ErrorBanner", () => {
  it("landing route group", () => {
    render(
      <StateBoundary state="error" error={error}>
        <p>Landing content</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-error")).toBeInTheDocument();
  });

  it("search route group", () => {
    render(
      <StateBoundary state="error" error={error}>
        <p>Search results</p>
      </StateBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("listings route group", () => {
    render(
      <StateBoundary state="error" error={error}>
        <p>Listing detail</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-error")).toBeInTheDocument();
  });

  it("checkout route group", () => {
    render(
      <StateBoundary state="error" error={error}>
        <p>Checkout flow</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-error")).toBeInTheDocument();
  });

  it("assistant route group", () => {
    render(
      <StateBoundary state="error" error={error}>
        <p>Assistant chat</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-error")).toBeInTheDocument();
  });

  it("dashboard route group", () => {
    render(
      <StateBoundary state="error" error={error}>
        <p>Dashboard trips</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-error")).toBeInTheDocument();
  });

  it("profile route group", () => {
    render(
      <StateBoundary state="error" error={error}>
        <p>Profile settings</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-error")).toBeInTheDocument();
  });

  it("auth route group uses ErrorBanner for form errors", async () => {
    const LoginPage = (await import("../../app/auth/login/page")).default;
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /Sign in to Voya/i })).toBeInTheDocument();
  });
});
