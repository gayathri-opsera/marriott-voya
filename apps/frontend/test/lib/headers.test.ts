/**
 * WOREF-042: Security Header tests
 */
import { describe, it, expect } from "vitest";
// Use require since headers.js is CommonJS
const { SECURITY_HEADER_KEYS, securityHeaders, getSecurityHeadersArray } = require("../../lib/headers.js");

describe("security headers (WOREF-042)", () => {
  it("includes all required security header keys", () => {
    for (const key of SECURITY_HEADER_KEYS) {
      expect(Object.keys(securityHeaders)).toContain(key);
    }
  });

  it("sets X-Frame-Options to DENY", () => {
    expect(securityHeaders["X-Frame-Options"]).toBe("DENY");
  });

  it("sets X-Content-Type-Options to nosniff", () => {
    expect(securityHeaders["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("includes HSTS with long max-age", () => {
    const hsts = securityHeaders["Strict-Transport-Security"];
    expect(hsts).toContain("max-age=");
    const match = /max-age=(\d+)/.exec(hsts as string);
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(63072000);
  });

  it("enforces CSP (not report-only)", () => {
    expect(Object.keys(securityHeaders)).toContain("Content-Security-Policy");
    expect(Object.keys(securityHeaders)).not.toContain("Content-Security-Policy-Report-Only");
  });

  it("CSP blocks object-src", () => {
    expect(securityHeaders["Content-Security-Policy"]).toContain("object-src 'none'");
  });

  it("CSP restricts base-uri to self", () => {
    expect(securityHeaders["Content-Security-Policy"]).toContain("base-uri 'self'");
  });

  it("CSP allows Anthropic API for connect-src", () => {
    expect(securityHeaders["Content-Security-Policy"]).toContain("https://api.anthropic.com");
  });

  it("getSecurityHeadersArray returns flat key/value array for Next.js", () => {
    const arr = getSecurityHeadersArray() as Array<{ key: string; value: string }>;
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.every((h) => "key" in h && "value" in h)).toBe(true);
    expect(arr.length).toBeGreaterThan(0);
  });
});
