/**
 * @vitest-environment jsdom
 */
import { describe, it, vi, beforeEach } from "vitest";
import { renderAndTestA11y } from "../utils/axe";
import SearchPage from "../../app/search/page";
import { makeSearchResponse } from "../fixtures/searchResponse";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("origin=JFK&destination=LHR"),
}));

vi.mock("../../lib/api/client", () => ({
  apiGet: vi.fn(),
  configureAuth: vi.fn(),
}));

import { apiGet } from "../../lib/api/client";

describe("search page accessibility", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockResolvedValue(makeSearchResponse());
  });

  it("has no axe violations with mock results", async () => {
    await renderAndTestA11y(<SearchPage />);
  });
});
