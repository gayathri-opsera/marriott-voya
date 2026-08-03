/**
 * Shadow and elevation tokens — WO-022
 */

export const shadowTokens = {
  none:  "none",
  xs:    "var(--shadow-xs)",
  sm:    "var(--shadow-sm)",
  md:    "var(--shadow-md)",
  lg:    "var(--shadow-lg)",
  xl:    "var(--shadow-xl)",
  "2xl": "var(--shadow-2xl)",
  /** Inset for pressed/active states */
  inner: "var(--shadow-inner)",
} as const;

/** Elevation levels used by the component library */
export const elevationTokens = {
  flat:    0,
  raised:  1,
  overlay: 2,
  modal:   3,
  toast:   4,
} as const;

export type ShadowToken    = typeof shadowTokens;
export type ElevationToken = typeof elevationTokens;
