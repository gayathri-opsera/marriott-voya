/**
 * Motion / animation tokens — WO-022
 * All durations respect the user's `prefers-reduced-motion` preference.
 * Components MUST use these tokens; never hardcode animation values.
 */

export const durationTokens = {
  instant:  "var(--duration-instant)",  // 0ms (no animation)
  fast:     "var(--duration-fast)",     // 100ms
  normal:   "var(--duration-normal)",   // 200ms
  moderate: "var(--duration-moderate)", // 300ms
  slow:     "var(--duration-slow)",     // 450ms
  xslow:    "var(--duration-xslow)",    // 600ms
} as const;

export const easingTokens = {
  /** Standard entrance easing */
  easeIn:     "var(--ease-in)",
  /** Standard exit easing */
  easeOut:    "var(--ease-out)",
  /** Transition between states */
  easeInOut:  "var(--ease-in-out)",
  /** Overshoot for interactive bounce */
  spring:     "var(--ease-spring)",
  /** Flat — prefer durationTokens.instant to skip entirely */
  linear:     "linear",
} as const;

export type DurationToken = typeof durationTokens;
export type EasingToken   = typeof easingTokens;
