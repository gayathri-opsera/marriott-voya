import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast } from "../../src/primitives/Toast";
import { renderWithProviders } from "../utils/render";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders title and description", () => {
    renderWithProviders(
      <Toast title="Booking confirmed" description="Your trip is saved" />,
    );
    expect(screen.getByText("Booking confirmed")).toBeInTheDocument();
    expect(screen.getByText("Your trip is saved")).toBeInTheDocument();
  });

  it("uses role=alert for error variant", () => {
    renderWithProviders(<Toast title="Payment failed" variant="error" />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("auto-dismisses after duration", () => {
    const onDismiss = vi.fn();
    renderWithProviders(
      <Toast title="Saved" duration={5000} onDismiss={onDismiss} />,
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
