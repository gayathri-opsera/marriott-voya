import { describe, it, expect } from "vitest";
import {
  TOKEN_MANIFEST,
  getTokenCssVariable,
  getTokensByCategory,
} from "../../lib/tokens-manifest";

describe("tokens manifest", () => {
  it("lists all token names with cssVariable fields", () => {
    expect(TOKEN_MANIFEST.length).toBeGreaterThan(0);
    for (const entry of TOKEN_MANIFEST) {
      expect(entry.name).toBeTruthy();
      expect(entry.cssVariable).toMatch(/^--/);
      expect(entry.category).toBeTruthy();
    }
  });

  it("getTokenCssVariable resolves known tokens", () => {
    expect(getTokenCssVariable("brand-primary")).toBe("--color-brand-primary");
    expect(getTokenCssVariable("text-muted")).toBe("--color-text-muted");
    expect(getTokenCssVariable("unknown-token")).toBeUndefined();
  });

  it("getTokensByCategory groups tokens correctly", () => {
    const surfaceTokens = getTokensByCategory("surface");
    expect(surfaceTokens.length).toBeGreaterThan(0);
    expect(surfaceTokens.every((t) => t.category === "surface")).toBe(true);
    expect(surfaceTokens.some((t) => t.name === "surface-default")).toBe(true);
  });
});
