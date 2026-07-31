export { colorTokens, type ColorToken } from "./colors.js";
export { spacingTokens, radiusTokens, type SpacingToken, type RadiusToken } from "./spacing.js";

import { colorTokens } from "./colors.js";
import { spacingTokens, radiusTokens } from "./spacing.js";

export const tokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  radii: radiusTokens,
} as const;
