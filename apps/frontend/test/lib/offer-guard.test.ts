import { describe, it, expect } from "vitest";
import { guardOffer, secondsUntilExpiry, isExpiringSoon } from "../../lib/offer-guard.js";

const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
const pastDate   = new Date(Date.now() - 60 * 1000).toISOString();

describe("guardOffer", () => {
  it("returns VALID for a bookable offer with future expiry", () => {
    const result = guardOffer({ bookabilityStatus: "BOOKABLE", expiresAt: futureDate, provenance: "HVMI" });
    expect(result.status).toBe("VALID");
    expect(result.canProceed).toBe(true);
  });

  it("returns UNKNOWN for null offer", () => {
    const result = guardOffer(null);
    expect(result.status).toBe("UNKNOWN");
    expect(result.canProceed).toBe(false);
    expect(result.action).toBe("re-search");
  });

  it("returns EXPIRED for past expiry", () => {
    const result = guardOffer({ bookabilityStatus: "BOOKABLE", expiresAt: pastDate });
    expect(result.status).toBe("EXPIRED");
    expect(result.canProceed).toBe(false);
  });

  it("returns ILLUSTRATIVE for provenance=ILLUSTRATIVE", () => {
    const result = guardOffer({ provenance: "ILLUSTRATIVE" });
    expect(result.status).toBe("ILLUSTRATIVE");
    expect(result.canProceed).toBe(false);
  });

  it("returns NOT_BOOKABLE for bookable=false", () => {
    const result = guardOffer({ bookable: false });
    expect(result.status).toBe("NOT_BOOKABLE");
    expect(result.canProceed).toBe(false);
  });

  it("returns VALID when no expiry set and bookable", () => {
    const result = guardOffer({ bookabilityStatus: "BOOKABLE" });
    expect(result.status).toBe("VALID");
    expect(result.canProceed).toBe(true);
  });

  it("returns EXPIRED for bookabilityStatus=EXPIRED", () => {
    const result = guardOffer({ bookabilityStatus: "EXPIRED" });
    expect(result.status).toBe("EXPIRED");
    expect(result.canProceed).toBe(false);
  });
});

describe("secondsUntilExpiry", () => {
  it("returns null for offer with no expiresAt", () => {
    expect(secondsUntilExpiry({})).toBeNull();
  });

  it("returns ~0 for past expiry", () => {
    expect(secondsUntilExpiry({ expiresAt: pastDate })).toBe(0);
  });

  it("returns positive value for future expiry", () => {
    const secs = secondsUntilExpiry({ expiresAt: futureDate });
    expect(secs).toBeGreaterThan(0);
    expect(secs).toBeLessThanOrEqual(30 * 60);
  });
});

describe("isExpiringSoon", () => {
  it("returns false for offer expiring in > 5 min", () => {
    expect(isExpiringSoon({ expiresAt: futureDate })).toBe(false);
  });

  it("returns true for offer expiring in < 5 min", () => {
    const soonDate = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    expect(isExpiringSoon({ expiresAt: soonDate })).toBe(true);
  });

  it("returns false for expired offer", () => {
    expect(isExpiringSoon({ expiresAt: pastDate })).toBe(false);
  });
});
