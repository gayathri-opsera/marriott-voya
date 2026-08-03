/**
 * Unit tests for accessibility harness — WO-049
 */

import { describe, it, expect } from "vitest";
import { checkContrast, AXE_CONFIG } from "../../lib/accessibility";

describe("checkContrast (WO-049)", () => {
  it("Voya amber on dark — must pass AA large text", () => {
    // --voya-accent: #c09a6b on --voya-surface-0: #14100c
    const { ratio, passes } = checkContrast("#c09a6b", "#14100c", true);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
    expect(passes).toBe(true);
  });

  it("white text on dark background passes AA", () => {
    const { passes } = checkContrast("#ffffff", "#14100c");
    expect(passes).toBe(true);
  });

  it("very low contrast pair fails AA", () => {
    const { passes } = checkContrast("#888888", "#999999");
    expect(passes).toBe(false);
  });

  it("returns a numeric ratio", () => {
    const { ratio } = checkContrast("#ffffff", "#000000");
    expect(ratio).toBe(21); // Max possible contrast
  });

  it("symmetry: fg/bg swap yields same ratio", () => {
    const a = checkContrast("#c09a6b", "#14100c");
    const b = checkContrast("#14100c", "#c09a6b");
    expect(a.ratio).toBe(b.ratio);
  });
});

describe("AXE_CONFIG (WO-049)", () => {
  it("targets WCAG 2.1 AA tags", () => {
    const runOnly = AXE_CONFIG["runOnly"] as { type: string; values: string[] };
    expect(runOnly.values).toContain("wcag2aa");
    expect(runOnly.values).toContain("wcag21aa");
  });

  it("has color-contrast rule enabled", () => {
    const rules = AXE_CONFIG["rules"] as Record<string, { enabled: boolean }>;
    expect(rules["color-contrast"].enabled).toBe(true);
  });

  it("has image-alt rule enabled", () => {
    const rules = AXE_CONFIG["rules"] as Record<string, { enabled: boolean }>;
    expect(rules["image-alt"].enabled).toBe(true);
  });

  it("has label rule enabled (form inputs)", () => {
    const rules = AXE_CONFIG["rules"] as Record<string, { enabled: boolean }>;
    expect(rules["label"].enabled).toBe(true);
  });
});
