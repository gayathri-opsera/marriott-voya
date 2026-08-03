/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderAndTestA11y } from "../utils/axe";
import CheckoutPage from "../../app/checkout/page";
import { ToastProvider } from "../../components/ui/Toast";
import { makeOffer } from "../fixtures/offer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("offerId=offer_test_01"),
}));

vi.mock("../../lib/api/client", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  configureAuth: vi.fn(),
}));

import { apiGet } from "../../lib/api/client";

describe("checkout page accessibility", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockResolvedValue(makeOffer());
  });

  it("has no axe violations on review step", async () => {
    await renderAndTestA11y(
      <ToastProvider>
        <CheckoutPage />
      </ToastProvider>,
    );
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
    });
  });
});
