import { describe, it, expect } from "vitest";
import { generateCsrfToken, verifyCsrfToken } from "../../lib/csrf.js";

describe("generateCsrfToken", () => {
  it("generates a non-empty token", () => {
    const token = generateCsrfToken();
    expect(token.length).toBeGreaterThan(20);
  });

  it("generates unique tokens each time", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).not.toBe(b);
  });
});

describe("verifyCsrfToken", () => {
  it("returns true for matching tokens", () => {
    const token = generateCsrfToken();
    expect(verifyCsrfToken(token, token)).toBe(true);
  });

  it("returns false for mismatched tokens", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(verifyCsrfToken(a, b)).toBe(false);
  });

  it("returns false if cookie token is undefined", () => {
    expect(verifyCsrfToken(undefined, "abc")).toBe(false);
  });

  it("returns false if header token is undefined", () => {
    expect(verifyCsrfToken("abc", undefined)).toBe(false);
  });

  it("returns false if both are undefined", () => {
    expect(verifyCsrfToken(undefined, undefined)).toBe(false);
  });
});
