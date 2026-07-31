/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SessionExpiryBanner } from "../../components/auth/SessionExpiryBanner";
import * as session from "../../lib/session";

vi.mock("../../lib/session", () => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  isAuthenticated: vi.fn(),
}));

describe("SessionExpiryBanner", () => {
  beforeEach(() => {
    vi.mocked(session.isAuthenticated).mockReturnValue(true);
    vi.mocked(session.refreshSession).mockResolvedValue(true);
  });

  it("does not render when session is not near expiry", async () => {
    vi.mocked(session.getSession).mockResolvedValue({
      accessToken: "token",
      userId: "user-1",
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    const { container } = render(<SessionExpiryBanner />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("shows banner when session expires within 5 minutes", async () => {
    vi.mocked(session.getSession).mockResolvedValue({
      accessToken: "token",
      userId: "user-1",
      expiresAt: Date.now() + 3 * 60 * 1000,
    });

    render(<SessionExpiryBanner />);
    await waitFor(() => {
      expect(screen.getByTestId("session-expiry-banner")).toBeInTheDocument();
    });
    expect(screen.getByText(/expires in 3 minutes/i)).toBeInTheDocument();
  });

  it("dismisses after successful refresh", async () => {
    vi.mocked(session.getSession).mockResolvedValue({
      accessToken: "token",
      userId: "user-1",
      expiresAt: Date.now() + 2 * 60 * 1000,
    });

    render(<SessionExpiryBanner />);
    await waitFor(() => {
      expect(screen.getByTestId("refresh-session-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("refresh-session-button"));

    await waitFor(() => {
      expect(session.refreshSession).toHaveBeenCalled();
    });
  });
});
