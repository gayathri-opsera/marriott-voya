import { describe, it, expect } from "vitest";
import {
  getContrastRatio,
  LIGHT_TOKEN_VALUES,
  TEXT_ON_SURFACE_PAIRS,
} from "../../lib/contrast";

describe("token contrast ratios", () => {
  it("all text-on-surface pairs meet WCAG 4.5:1 minimum", () => {
    const failures: string[] = [];

    for (const pair of TEXT_ON_SURFACE_PAIRS) {
      const fg = LIGHT_TOKEN_VALUES[pair.text];
      const bg = LIGHT_TOKEN_VALUES[pair.surface];
      if (!fg || !bg) continue;

      const ratio = getContrastRatio(fg, bg);
      if (ratio === null || ratio < 4.5) {
        failures.push(`${pair.label}: ${ratio?.toFixed(2) ?? "N/A"}:1 (fg=${fg}, bg=${bg})`);
      }
    }

    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("text-primary on surface-default has sufficient contrast", () => {
    const ratio = getContrastRatio(
      LIGHT_TOKEN_VALUES["--color-text-primary"]!,
      LIGHT_TOKEN_VALUES["--color-surface-default"]!,
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
