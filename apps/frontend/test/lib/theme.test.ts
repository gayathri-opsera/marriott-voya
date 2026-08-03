/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  applyThemeClass,
  getTheme,
  resolveTheme,
  setTheme,
} from "../../lib/theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("getTheme returns stored preference", () => {
    setTheme("dark");
    expect(getTheme()).toBe("dark");
  });

  it("resolveTheme resolves system via matchMedia", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true,
      media: "",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })));
    expect(resolveTheme("system")).toBe("dark");
  });

  it("applyThemeClass toggles dark class on html", () => {
    applyThemeClass("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyThemeClass("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
