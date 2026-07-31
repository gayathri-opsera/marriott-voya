/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PrivacyPage from "../../app/profile/privacy/page";

vi.mock("../../lib/api/client", () => ({
  apiGet: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock("../../components/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import { apiGet } from "../../lib/api/client";

describe("privacy route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders data export section", async () => {
    vi.mocked(apiGet).mockResolvedValue({ documents: [] });
    render(<PrivacyPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "My Data" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Download my data/i })).toBeInTheDocument();
  });

  it("shows masked passport numbers", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      documents: [{ id: "1", type: "Passport", maskedNumber: "••••••1234" }],
    });
    render(<PrivacyPage />);
    await waitFor(() => {
      expect(screen.getByText("••••••1234")).toBeInTheDocument();
    });
  });

  it("shows delete account confirmation dialog", async () => {
    vi.mocked(apiGet).mockResolvedValue({ documents: [] });
    render(<PrivacyPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Delete my account/i })).toBeInTheDocument();
    });
  });
});
