export { colorTokens, type ColorToken } from "./colors.js";
export { spacingTokens, radiusTokens, type SpacingToken, type RadiusToken } from "./spacing.js";
export {
  fontFamilyTokens, fontSizeTokens, fontWeightTokens, lineHeightTokens, letterSpacingTokens,
  type FontFamilyToken, type FontSizeToken, type FontWeightToken, type LineHeightToken, type LetterSpacingToken,
} from "./typography.js";
export { shadowTokens, elevationTokens, type ShadowToken, type ElevationToken } from "./shadows.js";
export { durationTokens, easingTokens, type DurationToken, type EasingToken } from "./motion.js";
export { zIndexTokens, type ZIndexToken } from "./zIndex.js";

import { colorTokens } from "./colors.js";
import { spacingTokens, radiusTokens } from "./spacing.js";
import { fontFamilyTokens, fontSizeTokens, fontWeightTokens, lineHeightTokens, letterSpacingTokens } from "./typography.js";
import { shadowTokens, elevationTokens } from "./shadows.js";
import { durationTokens, easingTokens } from "./motion.js";
import { zIndexTokens } from "./zIndex.js";

export const tokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  radii: radiusTokens,
  fontFamily: fontFamilyTokens,
  fontSize: fontSizeTokens,
  fontWeight: fontWeightTokens,
  lineHeight: lineHeightTokens,
  letterSpacing: letterSpacingTokens,
  shadows: shadowTokens,
  elevation: elevationTokens,
  duration: durationTokens,
  easing: easingTokens,
  zIndex: zIndexTokens,
} as const;
