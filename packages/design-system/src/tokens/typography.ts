/**
 * Typography tokens — WO-022
 * All values map to CSS custom properties that must be defined in globals.css.
 */

export const fontFamilyTokens = {
  sans:    "var(--font-sans)",
  serif:   "var(--font-serif)",
  mono:    "var(--font-mono)",
  display: "var(--font-display)",
} as const;

export const fontSizeTokens = {
  xs:   "var(--text-xs)",   // 11px
  sm:   "var(--text-sm)",   // 13px
  base: "var(--text-base)", // 15px
  md:   "var(--text-md)",   // 16px
  lg:   "var(--text-lg)",   // 18px
  xl:   "var(--text-xl)",   // 20px
  "2xl":"var(--text-2xl)",  // 24px
  "3xl":"var(--text-3xl)",  // 30px
  "4xl":"var(--text-4xl)",  // 36px
  "5xl":"var(--text-5xl)",  // 48px
} as const;

export const fontWeightTokens = {
  light:    "var(--weight-light)",
  regular:  "var(--weight-regular)",
  medium:   "var(--weight-medium)",
  semibold: "var(--weight-semibold)",
  bold:     "var(--weight-bold)",
  extrabold:"var(--weight-extrabold)",
} as const;

export const lineHeightTokens = {
  tight:   "var(--leading-tight)",
  snug:    "var(--leading-snug)",
  normal:  "var(--leading-normal)",
  relaxed: "var(--leading-relaxed)",
  loose:   "var(--leading-loose)",
} as const;

export const letterSpacingTokens = {
  tight:  "var(--tracking-tight)",
  normal: "var(--tracking-normal)",
  wide:   "var(--tracking-wide)",
  wider:  "var(--tracking-wider)",
  widest: "var(--tracking-widest)",
} as const;

export type FontFamilyToken  = typeof fontFamilyTokens;
export type FontSizeToken    = typeof fontSizeTokens;
export type FontWeightToken  = typeof fontWeightTokens;
export type LineHeightToken  = typeof lineHeightTokens;
export type LetterSpacingToken = typeof letterSpacingTokens;
