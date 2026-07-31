import { describe, it, expect, vi, beforeEach } from "vitest";
import * as analytics from "../../lib/analytics";

describe("landing analytics", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
  });

  it("trackEvent sends LANDING_VIEWED on mount pattern", () => {
    analytics.trackEvent("LANDING_VIEWED", {});
    expect(fetch).toHaveBeenCalledWith(
      "/api/events",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "LANDING_VIEWED", props: {} }),
      }),
    );
  });

  it("trackEvent sends ENTRY_CARD_CLICKED with destination", () => {
    analytics.trackEvent("ENTRY_CARD_CLICKED", { destination: "search" });
    expect(fetch).toHaveBeenCalledWith(
      "/api/events",
      expect.objectContaining({
        body: JSON.stringify({ name: "ENTRY_CARD_CLICKED", props: { destination: "search" } }),
      }),
    );
  });
});
