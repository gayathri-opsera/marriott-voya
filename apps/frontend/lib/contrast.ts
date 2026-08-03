/**
 * WCAG contrast ratio utilities for design token verification.
 */

export function parseHexColor(value: string): { r: number; g: number; b: number } | null {
  const hex = value.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3,8}$/.test(hex)) return null;

  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex.slice(0, 6);

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastRatio(fg: string, bg: string): number | null {
  const fgColor = parseHexColor(fg);
  const bgColor = parseHexColor(bg);
  if (!fgColor || !bgColor) return null;

  const fgLum = relativeLuminance(fgColor.r, fgColor.g, fgColor.b);
  const bgLum = relativeLuminance(bgColor.r, bgColor.g, bgColor.b);
  return contrastRatio(fgLum, bgLum);
}

/** Token values from globals.css :root — used by contrast tests. */
export const LIGHT_TOKEN_VALUES: Record<string, string> = {
  "--color-surface-default": "#ffffff",
  "--color-surface-subtle": "#f8f9fa",
  "--color-surface-muted": "#e9ecef",
  "--color-surface-secondary": "#f1f3f5",
  "--color-surface-tertiary": "#dee2e6",
  "--color-text-primary": "#1a1a2e",
  "--color-text-secondary": "#495057",
  "--color-text-muted": "#6c757d",
  "--color-text-tertiary": "#868e96",
  "--color-text-inverse": "#ffffff",
  "--color-brand-primary": "#3b5bdb",
  "--color-brand-secondary": "#6080ff",
  "--color-success": "#2f9e44",
  "--color-warning": "#e67700",
  "--color-danger": "#c92a2a",
  "--color-info": "#1971c2",
  "--color-border-default": "#dee2e6",
  "--color-border-subtle": "#e9ecef",
};

export const TEXT_ON_SURFACE_PAIRS: Array<{ text: string; surface: string; label: string }> = [
  { text: "--color-text-primary", surface: "--color-surface-default", label: "primary on default" },
  { text: "--color-text-primary", surface: "--color-surface-subtle", label: "primary on subtle" },
  { text: "--color-text-secondary", surface: "--color-surface-default", label: "secondary on default" },
  { text: "--color-text-muted", surface: "--color-surface-default", label: "muted on default" },
  { text: "--color-text-inverse", surface: "--color-brand-primary", label: "inverse on brand" },
];
