import { describe, it, expect } from "vitest";
import { SECURITY_HEADER_KEYS, securityHeaders } from "../../lib/headers";

describe("security headers", () => {
  it("defines all required header keys", () => {
    for (const key of SECURITY_HEADER_KEYS) {
      expect(securityHeaders).toHaveProperty(key);
    }
  });

  it("sets expected security header values", () => {
    expect(securityHeaders["X-Frame-Options"]).toBe("DENY");
    expect(securityHeaders["X-Content-Type-Options"]).toBe("nosniff");
    expect(securityHeaders["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(securityHeaders["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
    expect(securityHeaders["Content-Security-Policy-Report-Only"]).toContain("default-src 'self'");
    expect(securityHeaders["Content-Security-Policy-Report-Only"]).toContain("https://js.stripe.com");
  });
});
