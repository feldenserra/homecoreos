"use client";

import { createTheme, rem } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "clay",
  primaryShade: 6,
  defaultRadius: "md",
  fontFamily:
    "var(--font-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
  headings: {
    fontFamily:
      "var(--font-display), ui-serif, Georgia, serif",
    fontWeight: "550",
  },
  colors: {
    clay: [
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
    ],
  },
  components: {
    Button: {
      defaultProps: {
        fw: 600,
      },
      styles: {
        root: {
          minHeight: rem(44),
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        color: "clay",
      },
      styles: {
        root: {
          minHeight: rem(44),
          minWidth: rem(44),
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          minHeight: rem(44),
          backgroundColor: "var(--hc-surface)",
          borderColor: "var(--hc-line)",
          color: "var(--hc-ink)",
        },
      },
    },
    PasswordInput: {
      styles: {
        input: {
          minHeight: rem(44),
          backgroundColor: "var(--hc-surface)",
          borderColor: "var(--hc-line)",
          color: "var(--hc-ink)",
        },
      },
    },
    Textarea: {
      styles: {
        input: {
          backgroundColor: "var(--hc-surface)",
          borderColor: "var(--hc-line)",
          color: "var(--hc-ink)",
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: "sm",
      },
    },
  },
});
