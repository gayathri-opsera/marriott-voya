import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ExpiryCountdown } from "../../components/results/ExpiryCountdown";

describe("ExpiryCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-31T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows nothing when expiresAt is null", () => {
    const { container } = render(<ExpiryCountdown expiresAt={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows countdown when expiry is within 30 minutes", () => {
    const expiresAt = new Date("2026-07-31T12:15:00.000Z").toISOString();
    render(<ExpiryCountdown expiresAt={expiresAt} />);
    expect(screen.getByRole("status")).toHaveTextContent("Expires in 15m 0s");
  });

  it("shows Expired when past expiry", () => {
    const expiresAt = new Date("2026-07-31T11:50:00.000Z").toISOString();
    render(<ExpiryCountdown expiresAt={expiresAt} />);
    expect(screen.getByRole("status")).toHaveTextContent("Expired");
  });

  it("shows nothing when expiry is far in the future", () => {
    const expiresAt = new Date("2026-08-01T12:00:00.000Z").toISOString();
    const { container } = render(<ExpiryCountdown expiresAt={expiresAt} />);
    expect(container.firstChild).toBeNull();
  });
});
