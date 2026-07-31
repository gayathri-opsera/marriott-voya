/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PreferencesPage from "../../app/profile/preferences/page";

vi.mock("../../lib/api/client", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("../../components/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import { apiGet } from "../../lib/api/client";

describe("preferences route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders preference form fields", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      preferredCabinClass: "business",
      preferredAirlines: "Delta",
      mealPreference: "vegetarian",
      seatPreference: "window",
      accessibilityNeeds: "",
    });
    render(<PreferencesPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Preferred cabin class/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Preferred airlines/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Accessibility needs/i)).toBeInTheDocument();
  });

  it("shows error state on load failure", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Failed"));
    render(<PreferencesPage />);
    await waitFor(() => {
      expect(screen.getByTestId("state-error")).toBeInTheDocument();
    });
  });
});
