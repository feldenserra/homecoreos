import { Button, Text, Title } from "@mantine/core";
import {
  IconBrandGithub,
  IconHome,
  IconLayoutKanban,
  IconMessage,
} from "@tabler/icons-react";
import { HouseMark } from "../house-mark";

const GITHUB_URL = "https://github.com/feldenserra/homecoreos";

const FEATURES = [
  {
    title: "Tasks",
    meta: "Not started, in progress, stuck, complete.",
    body: "A kanban that admits real life. Chores stall. Work gets stuck. Everyone can see what is actually open.",
    Icon: IconLayoutKanban,
  },
  {
    title: "Chat",
    meta: "Ask the house.",
    body: "One thread for the household instead of another group chat. Ask about dinner or the leaking tap without losing the thread.",
    Icon: IconMessage,
  },
  {
    title: "Homes",
    meta: "Create one, or join with a 12-character invite.",
    body: "A shared space for a house. One home, or several. Invite the people who live there.",
    Icon: IconHome,
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

export function LandingPage() {
  return (
    <div className="landing" id="top">
      <header className="landing-nav">
        <a href="#top" className="landing-nav-brand">
          <HouseMark />
          <span className="wordmark">HomeCore</span>
        </a>
        <div className="landing-nav-actions">
          <a
            className="landing-nav-github"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandGithub size={18} stroke={1.7} />
            GitHub
          </a>
          <Button component="a" href="/login" size="sm">
            Log in
          </Button>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <HouseMark className="landing-hero-mark" />
          <p className="meta-label">Open source</p>
          <Title
            id="landing-hero-title"
            order={1}
            className="display-title"
            fz={{ base: 40, sm: 56 }}
            fw={550}
            lh={1.08}
          >
            The house, finally in one place.
          </Title>
          <Text className="landing-hero-tagline" size="lg">
            Everything for the house, in one place.
          </Text>
          <Text className="landing-lead" c="dimmed" size="md">
            Chores and a household thread, kept in a space that belongs to the
            house. Not scattered across notes and a chat only one person
            remembers.
          </Text>
          <div className="landing-hero-cta">
            <Button
              component="a"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              leftSection={<IconBrandGithub size={18} stroke={1.7} />}
            >
              View on GitHub
            </Button>
            <Button component="a" href="#how" variant="default">
              See how it works
            </Button>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="landing-problem-title">
          <Title
            id="landing-problem-title"
            order={2}
            className="display-title"
            fz={28}
            fw={550}
          >
            The work of a house has nowhere to live.
          </Title>
          <ul className="landing-problem-list">
            <li>The list lives in someone’s head.</li>
            <li>
              Chores stall in group chats, and nobody can see what is actually
              open.
            </li>
          </ul>
          <Text className="landing-lead" c="dimmed">
            HomeCore is the shared surface for that work.
          </Text>
        </section>

        <section className="landing-section" aria-labelledby="landing-product-title">
          <p className="meta-label">The house</p>
          <Title
            id="landing-product-title"
            order={2}
            className="display-title"
            fz={28}
            fw={550}
            mb="lg"
          >
            What lives here
          </Title>
          <div className="landing-feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="app-tile">
                <span className="app-tile-icon">
                  <feature.Icon size={22} stroke={1.7} />
                </span>
                <span className="app-tile-name">{feature.title}</span>
                <span className="app-tile-meta">{feature.meta}</span>
                <Text size="sm" c="dimmed">
                  {feature.body}
                </Text>
              </article>
            ))}
          </div>
        </section>

        <section
          className="landing-section"
          id="how"
          aria-labelledby="landing-how-title"
        >
          <p className="meta-label">How it works</p>
          <Title
            id="landing-how-title"
            order={2}
            className="display-title"
            fz={28}
            fw={550}
            mb="lg"
          >
            Start with a home. Then invite the people who live there.
          </Title>
          <ol className="landing-steps">
            {STEPS.map((step) => (
              <li key={step.n} className="landing-step">
                <span className="landing-step-n">{step.n}</span>
                <div>
                  <Title order={3} className="display-title" fz={20} fw={550}>
                    {step.title}
                  </Title>
                  <Text size="sm" c="dimmed" mt={6}>
                    {step.body}
                  </Text>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section landing-oss" aria-labelledby="landing-oss-title">
          <p className="meta-label">Open source</p>
          <Title
            id="landing-oss-title"
            order={2}
            className="display-title"
            fz={28}
            fw={550}
          >
            Self-host it and make it yours.
          </Title>
          <Text className="landing-lead" c="dimmed">
            This site is the product homepage. The app runs where you host it,
            on your machine.
          </Text>
          <Button
            component="a"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            leftSection={<IconBrandGithub size={18} stroke={1.7} />}
            mt="md"
          >
            View the repository
          </Button>
        </section>
      </main>

      <footer className="landing-footer">
        <a href="#top" className="landing-nav-brand">
          <HouseMark />
          <span className="wordmark">HomeCore</span>
        </a>
        <Text size="sm" c="dimmed">
          Everything for the house, in one place.
        </Text>
        <a
          className="landing-nav-github"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandGithub size={18} stroke={1.7} />
          GitHub
        </a>
      </footer>
    </div>
  );
}
