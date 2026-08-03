/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../../app/dashboard/page";
import * as tripsApi from "../../lib/api/trips";

vi.mock("../../lib/api/trips", () => ({
  fetchTrips: vi.fn(),
}));

describe("dashboard route states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("shows loading skeleton state", () => {
    vi.mocked(tripsApi.fetchTrips).mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByTestId("state-loading")).toBeInTheDocument();
  });

  it("shows empty state when no trips", async () => {
    vi.mocked(tripsApi.fetchTrips).mockResolvedValue([]);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("No upcoming trips")).toBeInTheDocument();
    });
  });

  it("shows error state with retry", async () => {
    vi.mocked(tripsApi.fetchTrips).mockRejectedValue(new Error("Failed"));
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByTestId("state-error")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows offline state when navigator is offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    vi.mocked(tripsApi.fetchTrips).mockResolvedValue([]);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByTestId("state-offline")).toBeInTheDocument();
    });
    expect(screen.getByText("You appear to be offline")).toBeInTheDocument();
  });
});
