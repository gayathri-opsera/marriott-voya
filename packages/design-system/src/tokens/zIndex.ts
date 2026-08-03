/**
 * Z-index scale — WO-022
 * Named layers prevent magic-number conflicts across components.
 */

export const zIndexTokens = {
  below:    -1,
  base:      0,
  raised:    10,
  dropdown:  100,
  sticky:    200,
  overlay:   300,
  modal:     400,
  toast:     500,
  tooltip:   600,
  skipLink:  700,
} as const;

export type ZIndexToken = typeof zIndexTokens;
