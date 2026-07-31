/**
 * Design token manifest — maps semantic token names to CSS custom properties.
 * Single source of truth for token documentation and lint validation.
 */

export interface TokenEntry {
  name: string;
  cssVariable: string;
  category: "surface" | "text" | "brand" | "status" | "border" | "overlay" | "focus" | "radius" | "font";
}

export const TOKEN_MANIFEST: readonly TokenEntry[] = [
  // Surface
  { name: "surface-default", cssVariable: "--color-surface-default", category: "surface" },
  { name: "surface-subtle", cssVariable: "--color-surface-subtle", category: "surface" },
  { name: "surface-muted", cssVariable: "--color-surface-muted", category: "surface" },
  { name: "surface-secondary", cssVariable: "--color-surface-secondary", category: "surface" },
  { name: "surface-tertiary", cssVariable: "--color-surface-tertiary", category: "surface" },
  // Text
  { name: "text-primary", cssVariable: "--color-text-primary", category: "text" },
  { name: "text-secondary", cssVariable: "--color-text-secondary", category: "text" },
  { name: "text-muted", cssVariable: "--color-text-muted", category: "text" },
  { name: "text-tertiary", cssVariable: "--color-text-tertiary", category: "text" },
  { name: "text-inverse", cssVariable: "--color-text-inverse", category: "text" },
  // Brand
  { name: "brand-primary", cssVariable: "--color-brand-primary", category: "brand" },
  { name: "brand-secondary", cssVariable: "--color-brand-secondary", category: "brand" },
  // Status
  { name: "success", cssVariable: "--color-success", category: "status" },
  { name: "warning", cssVariable: "--color-warning", category: "status" },
  { name: "danger", cssVariable: "--color-danger", category: "status" },
  { name: "info", cssVariable: "--color-info", category: "status" },
  // Border & overlay
  { name: "border-default", cssVariable: "--color-border-default", category: "border" },
  { name: "border-subtle", cssVariable: "--color-border-subtle", category: "border" },
  { name: "overlay", cssVariable: "--color-overlay", category: "overlay" },
  { name: "focus-ring", cssVariable: "--color-focus-ring", category: "focus" },
  // Radius
  { name: "radius-sm", cssVariable: "--radius-sm", category: "radius" },
  { name: "radius-md", cssVariable: "--radius-md", category: "radius" },
  { name: "radius-lg", cssVariable: "--radius-lg", category: "radius" },
  { name: "radius-xl", cssVariable: "--radius-xl", category: "radius" },
  // Font
  { name: "font-sans", cssVariable: "--font-sans", category: "font" },
  { name: "font-mono", cssVariable: "--font-mono", category: "font" },
] as const;

export function getTokenCssVariable(name: string): string | undefined {
  return TOKEN_MANIFEST.find((t) => t.name === name)?.cssVariable;
}

export function getTokensByCategory(category: TokenEntry["category"]): TokenEntry[] {
  return TOKEN_MANIFEST.filter((t) => t.category === category);
}
