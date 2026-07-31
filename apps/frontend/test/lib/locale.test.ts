/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCurrency, getLocale, setCurrency, setLocale } from "../../lib/locale";

describe("locale", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("navigator", { ...navigator, language: "en-GB" });
  });

  it("getLocale returns stored value", () => {
    setLocale("de-DE");
    expect(getLocale()).toBe("de-DE");
  });

  it("getLocale falls back to browser locale", () => {
    expect(getLocale()).toBe("en-GB");
  });

  it("getCurrency defaults to USD and persists changes", () => {
    expect(getCurrency()).toBe("USD");
    setCurrency("EUR");
    expect(getCurrency()).toBe("EUR");
  });
});
