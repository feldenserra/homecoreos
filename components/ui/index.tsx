import { type ReactNode } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { HouseMark } from "../house-mark";
import {
  colors,
  displayTextStyle,
  gutter,
  metaLabelStyle,
  radius,
  shadowLift,
} from "../../theme/tokens";

/**
 * The small shared vocabulary the screens are built from.
 *
 * The web app got these for free: a 1,199-line global stylesheet plus Mantine's
 * Stack/Group/Paper/Title primitives. React Native has no cascade and Mantine is
 * web-only, so the handful of patterns that actually repeated live here rather
 * than being restated in every screen.
 */

/** Body content on the paper background, with the responsive gutter applied. */
export function Screen({
  children,
  scroll = false,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (scroll) {
    return (
      <ScrollView
        contentContainerStyle={[styles.screen, style]}
        // Lets a tap land on a button while the keyboard is open, instead of
        // being swallowed by the dismiss.
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.screen, style]}>{children}</View>;
}

export function LoadingScreen({ label }: { label?: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.clay} />
      {label ? <Text style={styles.mutedText}>{label}</Text> : null}
    </View>
  );
}

/** The `.display-title` rule. */
export function DisplayTitle({
  children,
  size = 28,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <Text style={[styles.displayTitle, { fontSize: size }]}>{children}</Text>
  );
}

/** The `.meta-label` rule: 11px, uppercase, tracked out, muted. */
export function MetaLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.metaLabel}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.mutedText}>{children}</Text>;
}

/** Inline form error. Rendered as null when there is nothing to say. */
export function ErrorText({ children }: { children?: string | null }) {
  return children ? <Text style={styles.errorText}>{children}</Text> : null;
}

/** The `.wordmark` rule: house glyph plus the display face. */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <View style={styles.wordmarkRow}>
      <HouseMark size={size * 0.8} />
      <Text style={[styles.displayTitle, { fontSize: size }]}>HomeCore</Text>
    </View>
  );
}

/** A raised panel — the `--hc-surface` + `--hc-shadow-lift` combination. */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.paper,
    padding: gutter.compact,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.paper,
  },
  displayTitle: {
    ...displayTextStyle,
    color: colors.ink,
  },
  metaLabel: metaLabelStyle,
  mutedText: {
    color: colors.muted,
    fontSize: 14,
  },
  errorText: {
    color: "#b3261e",
    fontSize: 14,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
    ...shadowLift,
  },
});
