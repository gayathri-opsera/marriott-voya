import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StateBoundary } from "../../components/patterns/StateBoundary";
import { ApiError } from "../../lib/api/errors";

describe("StateBoundary", () => {
  it("renders children in idle state", () => {
    render(
      <StateBoundary state="idle">
        <p>Content loaded</p>
      </StateBoundary>,
    );
    expect(screen.getByText("Content loaded")).toBeInTheDocument();
  });

  it("shows skeleton in loading state", () => {
    render(
      <StateBoundary state="loading">
        <p>Hidden</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-loading")).toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(
      <StateBoundary state="empty">
        <p>Hidden</p>
      </StateBoundary>,
    );
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("shows error banner with retry", async () => {
    const onRetry = vi.fn();
    render(
      <StateBoundary
        state="error"
        error={new ApiError(500, "internal_error", "Server error")}
        onRetry={onRetry}
      >
        <p>Hidden</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-error")).toBeInTheDocument();
    expect(screen.getByText("Server error")).toBeInTheDocument();
  });

  it("shows offline banner", () => {
    render(
      <StateBoundary state="offline" onRetry={vi.fn()}>
        <p>Hidden</p>
      </StateBoundary>,
    );
    expect(screen.getByTestId("state-offline")).toBeInTheDocument();
    expect(screen.getByText("You appear to be offline")).toBeInTheDocument();
  });
});
