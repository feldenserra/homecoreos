/**
 * Design tokens, carried over verbatim from the `:root` block of the old
 * app/globals.css and the clay palette in theme.ts.
 *
 * The web build set these as CSS custom properties; React Native has no
 * cascade, so they are plain values imported where needed.
 *
 * Dark mode is intentionally absent. The web app forced
 * `colorScheme="light"` on both ColorSchemeScript and MantineProvider, and
 * inventing a dark palette here would be a design decision, not a migration.
 */

export const colors = {
  paper: "#f3ede3",
  paper2: "#e8e0d2",
  ink: "#2c241c",
  muted: "#7a6f63",
  line: "rgba(44, 36, 28, 0.1)",
  surface: "#fffaf3",
  clay: "#c45c26",
  claySoft: "#f3d5c4",
} as const;

/** Per-status kanban column accents. */
export const statusColors = {
  not_started: "#7a746c",
  in_progress: "#5b7c99",
  stuck: "#c4922a",
  complete: "#5c7a4a",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;

/** Was a media-query-driven CSS variable (16px, 24px at 48em). */
export const gutter = {
  compact: 16,
  wide: 24,
} as const;

/** 48em, the single breakpoint the web layout used. */
export const WIDE_BREAKPOINT = 768;

/**
 * `--hc-shadow-lift: 0 10px 28px rgba(44, 36, 28, 0.08)` translated to the two
 * platforms' shadow models.
 */
export const shadowLift = {
  shadowColor: "#2c241c",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 4,
} as const;

/**
 * Every interactive control was pinned to a 44pt minimum in the Mantine theme —
 * the iOS touch-target floor. Worth keeping now that touch is the only input.
 */
export const TOUCH_TARGET = 44;

/** 16px on inputs, which is what stops iOS Safari zooming on focus. */
export const INPUT_FONT_SIZE = 16;

export const clayScale = [
  "#FDF6F1",
  "#F6E4D8",
  "#EDC9B0",
  "#E0A47E",
  "#D17E4D",
  "#C45C26",
  "#A84E21",
  "#8A401C",
  "#6C3317",
  "#4A220F",
] as const;

/**
 * The web build loaded Geist and Fraunces from Google Fonts via next/font.
 *
 * Body text now uses the platform sans (`undefined` = San Francisco on iOS,
 * Roboto on Android, system stack on web). Geist is close enough to all three
 * that shipping ~200 KB of webfont to get it is a poor trade on mobile, and the
 * system face renders better at small sizes.
 *
 * Fraunces is kept, because the wordmark and headings are where the brand lives.
 * Loaded in app/_layout.tsx; `fonts.display` is only valid after that resolves.
 */
export const fonts = {
  sans: undefined as string | undefined,
  display: "Fraunces_600SemiBold",
  mono: undefined as string | undefined,
} as const;

/** The `.display-title` / `.wordmark` rule. */
export const displayTextStyle = {
  fontFamily: fonts.display,
  letterSpacing: -0.4,
} as const;

/** The `.meta-label` rule: 11px, uppercase, tracked out, muted. */
export const metaLabelStyle = {
  fontSize: 11,
  fontWeight: "600",
  letterSpacing: 0.66,
  textTransform: "uppercase",
  color: colors.muted,
} as const;
