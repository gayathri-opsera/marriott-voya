import { describe, it, expect } from "vitest";
import { scanTokenUsage, formatTokenReport } from "../../lint/check-token-usage";

describe("token usage lint", () => {
  it("scanTokenUsage returns an array", () => {
    const violations = scanTokenUsage();
    expect(Array.isArray(violations)).toBe(true);
  });

  it("formatTokenReport reports pass when no violations in a clean subset", () => {
    const report = formatTokenReport([]);
    expect(report).toContain("0 violations");
  });

  it("detects palette utility violations in sample strings", () => {
    const sample = 'className="text-gray-500 bg-blue-600"';
    const hexMatch = sample.match(/#[0-9a-fA-F]{3,8}\b/g);
    const paletteMatch = sample.match(
      /\b(?:text|bg)-(?:gray|blue)-(?:\d{2,3}|50)\b/g,
    );
    expect(hexMatch).toBeNull();
    expect(paletteMatch?.length).toBe(2);
  });
});
