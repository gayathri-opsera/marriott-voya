/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SessionsPage from "../../app/profile/sessions/page";

vi.mock("../../lib/api/client", () => ({
  apiGet: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock("../../components/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import { apiGet } from "../../lib/api/client";

describe("sessions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists active sessions", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      { id: "1", device: "MacBook Pro", ip: "192.168.1.1", lastActive: "2026-07-31T10:00:00Z", current: true },
      { id: "2", device: "iPhone", ip: "10.0.0.5", lastActive: "2026-07-30T08:00:00Z", current: false },
    ]);
    render(<SessionsPage />);
    await waitFor(() => {
      expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
    });
    expect(screen.getByText("This device")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Unauthorized"));
    render(<SessionsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("state-error")).toBeInTheDocument();
    });
  });
});
