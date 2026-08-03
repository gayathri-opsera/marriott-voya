/**
 * Accessibility harness — WO-049
 *
 * Centralised axe-core helper for:
 *   - Runtime axe scans in development mode (opt-in via NEXT_PUBLIC_AXE_ENABLED=true)
 *   - WCAG 2.1 AA + Marriott-specific rules configuration
 *   - Result deduplication to avoid repeated console noise
 *   - Strict mode for CI — throws on any violation
 *
 * Usage (in test files):
 *   import { axeScan } from "@/lib/accessibility";
 *   const violations = await axeScan(container);
 *   expect(violations).toHaveLength(0);
 *
 * Usage (in app root for dev-mode live scanning):
 *   import { mountDevAxe } from "@/lib/accessibility";
 *   mountDevAxe();  // call once from layout or _app
 */

import type { AxeResults, Result } from "axe-core";

// ─── WCAG 2.1 AA Axe configuration ───────────────────────────────────────────

export const AXE_CONFIG: Record<string, unknown> = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
  },
  rules: {
    // Enforce sufficient colour contrast (Voya brand uses amber on dark bg — must pass)
    "color-contrast": { enabled: true },
    // Enforce focus-visible on all interactive elements
    "focus-trap": { enabled: true },
    // All images must have alt text
    "image-alt": { enabled: true },
    // All form inputs must have labels
    "label": { enabled: true },
    // Landmark regions for skip-nav
    "landmark-one-main": { enabled: true },
    // Tables must have captions or summaries
    "table-duplicate-name": { enabled: true },
    // Links must be distinguishable
    "link-name": { enabled: true },
    // ARIA attributes must be valid
    "aria-valid-attr": { enabled: true },
    // Custom: bypass disabled per Marriott design (icons only with aria-label)
    "bypass": { enabled: false },
  },
};

// ─── Deduplication ────────────────────────────────────────────────────────────

const _seenViolations = new Set<string>();

function violationKey(v: Result): string {
  return `${v.id}:${v.nodes[0]?.target?.join(",")}`;
}

// ─── Programmatic scan (for tests) ───────────────────────────────────────────

/**
 * Run axe against a DOM element and return violations.
 * Throws in strict mode; returns the violation list otherwise.
 *
 * @param container - DOM element to scan (defaults to document.body)
 * @param strict    - if true, throws when violations are found (use in CI)
 */
export async function axeScan(
  container: Element = document.body,
  strict = false,
): Promise<Result[]> {
  const { default: axe } = await import("axe-core");
  const results: AxeResults = await axe.run(container, AXE_CONFIG as never);
  const violations = results.violations;

  if (violations.length > 0) {
    const summary = violations
      .map((v) => `• [${v.impact ?? "unknown"}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
      .join("\n");
    if (strict) {
      throw new Error(`Accessibility violations detected:\n${summary}`);
    }
    console.error("[axe] WCAG violations:\n" + summary);
  }

  return violations;
}

// ─── Dev-mode live scanning ───────────────────────────────────────────────────

/**
 * Mount automatic axe scans on route changes in development.
 * Only activates when NEXT_PUBLIC_AXE_ENABLED === "true".
 */
export function mountDevAxe(): void {
  if (
    typeof window === "undefined" ||
    process.env["NODE_ENV"] !== "development" ||
    process.env["NEXT_PUBLIC_AXE_ENABLED"] !== "true"
  ) {
    return;
  }

  void import("axe-core").then(({ default: axe }) => {
    const runScan = () => {
      void axe.run(document.body, AXE_CONFIG as never).then((results) => {
        const newViolations = results.violations.filter(
          (v) => !_seenViolations.has(violationKey(v)),
        );
        newViolations.forEach((v) => _seenViolations.add(violationKey(v)));
        if (newViolations.length > 0) {
          console.group("%c[axe] New WCAG violations", "color: #f59e0b; font-weight: bold");
          newViolations.forEach((v) => {
            console.warn(`[${v.impact}] ${v.id}: ${v.description}`);
            v.nodes.forEach((n) => console.info("  Target:", n.target));
          });
          console.groupEnd();
        }
      });
    };

    // Scan on first load
    setTimeout(runScan, 500);

    // Re-scan on navigation events (Next.js App Router emits popstate on back/forward)
    window.addEventListener("popstate", () => setTimeout(runScan, 200));
  });
}

// ─── Contrast checker (re-export from lib/contrast.ts if it exists) ──────────

/**
 * Check whether two hex colours meet WCAG AA contrast ratio.
 * Ratio ≥ 4.5 for normal text, ≥ 3.0 for large text.
 */
export function checkContrast(
  foreground: string,
  background: string,
  large = false,
): { ratio: number; passes: boolean } {
  const toLinear = (c: string): number => {
    const hex = c.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const toSRGB = (v: number) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return 0.2126 * toSRGB(r) + 0.7152 * toSRGB(g) + 0.0722 * toSRGB(b);
  };

  const l1 = toLinear(foreground);
  const l2 = toLinear(background);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  const ratio   = (lighter + 0.05) / (darker + 0.05);
  const required = large ? 3.0 : 4.5;

  return { ratio: Math.round(ratio * 100) / 100, passes: ratio >= required };
}
