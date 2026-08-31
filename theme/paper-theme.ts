import {
  MD3LightTheme,
  configureFonts,
  type MD3Theme,
} from "react-native-paper";
import { colors, fonts, radius } from "./tokens";

/**
 * react-native-paper's MD3 theme, mapped onto the tokens from tokens.ts.
 *
 * Paper and react-navigation carry two separate theme systems. Anything that
 * styles navigation chrome (headers, tab bars) has to be told about these
 * colours as well — see navigationTheme below — or the app ends up half themed.
 */

/**
 * Only the display and headline variants are overridden. Body text keeps MD3's
 * platform default, which is the system sans — see the note in tokens.ts.
 */
const displayFontVariants = Object.fromEntries(
  (
    [
      "displayLarge",
      "displayMedium",
      "displaySmall",
      "headlineLarge",
      "headlineMedium",
      "headlineSmall",
    ] as const
  ).map((variant) => [
    variant,
    { ...MD3LightTheme.fonts[variant], fontFamily: fonts.display },
  ]),
);

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  // Only ever light: matches the web app's forceColorScheme="light".
  dark: false,
  roundness: radius.md / 4, // Paper multiplies roundness by 4.
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.clay,
    onPrimary: "#ffffff",
    primaryContainer: colors.claySoft,
    onPrimaryContainer: colors.ink,
    secondary: colors.muted,
    onSecondary: "#ffffff",
    background: colors.paper,
    onBackground: colors.ink,
    surface: colors.surface,
    onSurface: colors.ink,
    surfaceVariant: colors.paper2,
    onSurfaceVariant: colors.muted,
    outline: "rgba(44, 36, 28, 0.18)",
    outlineVariant: colors.line,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: "transparent",
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
  // Headings were Fraunces at weight 550 on the web. React Native cannot drive
  // a variable font axis, so the nearest static cut (600) is used.
  fonts: configureFonts({ config: displayFontVariants }),
};

/**
 * Navigation chrome, applied as `screenOptions` on every Stack and Tabs.
 *
 * Paper's theme and react-navigation's theme are independent systems: theming
 * one leaves the other on its defaults, which shows up as white headers over a
 * paper-coloured body. Setting these explicitly is less indirection than
 * bridging with adaptNavigationTheme and makes the coupling visible.
 */
export const navScreenOptions = {
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.ink,
  headerTitleStyle: {
    fontFamily: fonts.display,
    color: colors.ink,
  },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.paper },
} as const;

export const tabBarOptions = {
  tabBarActiveTintColor: colors.clay,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
  },
  tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const },
} as const;
