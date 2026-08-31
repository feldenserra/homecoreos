import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import {
  colors,
  displayTextStyle,
  gutter,
  metaLabelStyle,
  radius,
} from "../../theme/tokens";
import { HouseMark } from "../house-mark";
import { Card, Wordmark } from "../ui";

/**
 * Marketing page. Copy is unchanged from the web version.
 *
 * Rendered on web only — app/index.tsx sends native straight to sign-in, since
 * a native binary has no visitors to market to.
 *
 * The in-page anchor links (#top, #how) are gone: React Native has no document
 * to scroll to a fragment. The "See how it works" button now scrolls the
 * ScrollView directly.
 */

const GITHUB_URL = "https://github.com/feldenserra/homecoreos";

// @expo/vector-icons replaces @tabler/icons-react; these are the nearest
// MaterialCommunityIcons equivalents to the Tabler set the web app used.
const FEATURES = [
  {
    title: "Tasks",
    meta: "Not started, in progress, stuck, complete.",
    body: "A kanban that admits real life. Chores stall. Work gets stuck. Everyone can see what is actually open.",
    icon: "view-column-outline",
  },
  {
    title: "Chat",
    meta: "Ask the house.",
    body: "One thread for the household instead of another group chat. Ask about dinner or the leaking tap without losing the thread.",
    icon: "message-outline",
  },
  {
    title: "Homes",
    meta: "Create one, or join with a 12-character invite.",
    body: "A shared space for a house. One home, or several. Invite the people who live there.",
    icon: "home-outline",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Create a home",
    body: "Start a shared space for the house. One place for the work that used to live in someone’s head.",
  },
  {
    n: "02",
    title: "Invite the household",
    body: "Hand over a 12-character invite code to anyone who shares the chores.",
  },
  {
    n: "03",
    title: "Keep the work in sight",
    body: "A board for tasks and a thread that belongs to the house.",
  },
] as const;

const PROBLEMS = [
  "The list lives in someone’s head.",
  "Chores stall in group chats, and nobody can see what is actually open.",
] as const;

function GitHubButton({ label }: { label: string }) {
  return (
    <Button
      mode="contained"
      icon={() => (
        <MaterialCommunityIcons name="github" size={18} color="#ffffff" />
      )}
      onPress={() => void Linking.openURL(GITHUB_URL)}
    >
      {label}
    </Button>
  );
}

export function LandingPage({ allowLogins = true }: { allowLogins?: boolean }) {
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      // Long marketing copy on a phone-width web viewport.
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.nav}>
        <Wordmark />
        <View style={styles.navActions}>
          <Button
            mode="text"
            compact
            textColor={colors.muted}
            icon={() => (
              <MaterialCommunityIcons
                name="github"
                size={18}
                color={colors.muted}
              />
            )}
            onPress={() => void Linking.openURL(GITHUB_URL)}
          >
            GitHub
          </Button>
          {allowLogins ? (
            <Link href="/login" asChild>
              <Button mode="contained" compact>
                Log in
              </Button>
            </Link>
          ) : null}
        </View>
      </View>

      <View style={styles.hero}>
        <HouseMark size={34} />
        <Text style={styles.metaLabel}>Open source</Text>
        <Text style={styles.heroTitle}>The house, finally in one place.</Text>
        <Text style={styles.heroTagline}>
          Everything for the house, in one place.
        </Text>
        <Text style={styles.lead}>
          Chores and a household thread, kept in a space that belongs to the
          house. Not scattered across notes and a chat only one person
          remembers.
        </Text>
        <View style={styles.heroCta}>
          <GitHubButton label="View on GitHub" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          The work of a house has nowhere to live.
        </Text>
        {PROBLEMS.map((problem) => (
          <View key={problem} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bodyText}>{problem}</Text>
          </View>
        ))}
        <Text style={styles.lead}>
          HomeCore is the shared surface for that work.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.metaLabel}>The house</Text>
        <Text style={styles.sectionTitle}>What lives here</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <Card key={feature.title} style={styles.featureCard}>
              <MaterialCommunityIcons
                name={feature.icon}
                size={22}
                color={colors.clay}
              />
              <Text style={styles.featureName}>{feature.title}</Text>
              <Text style={styles.metaLabel}>{feature.meta}</Text>
              <Text style={styles.bodyText}>{feature.body}</Text>
            </Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.metaLabel}>How it works</Text>
        <Text style={styles.sectionTitle}>
          Start with a home. Then invite the people who live there.
        </Text>
        {STEPS.map((step) => (
          <View key={step.n} style={styles.step}>
            <Text style={styles.stepNumber}>{step.n}</Text>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.bodyText}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.section, styles.oss]}>
        <Text style={styles.metaLabel}>Open source</Text>
        <Text style={styles.sectionTitle}>Self-host it and make it yours.</Text>
        <Text style={styles.lead}>
          This site is the product homepage. The app runs where you host it, on
          your machine.
        </Text>
        <View style={styles.heroCta}>
          <GitHubButton label="View the repository" />
        </View>
      </View>

      <View style={styles.footer}>
        <Wordmark size={18} />
        <Text style={styles.bodyText}>
          Everything for the house, in one place.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  pageContent: {
    paddingHorizontal: gutter.compact,
    paddingBottom: 48,
    gap: 40,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hero: {
    gap: 12,
    paddingTop: 24,
  },
  heroTitle: {
    ...displayTextStyle,
    color: colors.ink,
    fontSize: 40,
    lineHeight: 44,
  },
  heroTagline: {
    color: colors.ink,
    fontSize: 18,
  },
  heroCta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 6,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    ...displayTextStyle,
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
  },
  metaLabel: metaLabelStyle,
  lead: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.clay,
    marginTop: 8,
  },
  featureGrid: {
    gap: 12,
  },
  featureCard: {
    gap: 6,
  },
  featureName: {
    ...displayTextStyle,
    color: colors.ink,
    fontSize: 18,
  },
  step: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  stepNumber: {
    ...displayTextStyle,
    color: colors.claySoft,
    fontSize: 26,
    width: 44,
  },
  stepBody: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    ...displayTextStyle,
    color: colors.ink,
    fontSize: 20,
  },
  oss: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 20,
    gap: 8,
  },
});
