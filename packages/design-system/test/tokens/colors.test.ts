import { describe, it, expect } from "vitest";
import { colorTokens } from "../../src/tokens/colors";

function collectTokenValues(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((value) =>
    typeof value === "string" ? [value] : collectTokenValues(value as Record<string, unknown>),
  );
}

describe("colorTokens", () => {
  it("uses CSS variable references for every token", () => {
    const values = collectTokenValues(colorTokens as unknown as Record<string, unknown>);
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value).toMatch(/^var\(--/);
    }
  });
});
