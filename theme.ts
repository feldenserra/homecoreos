"use client";

import { createTheme, rem } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "dark",
  primaryShade: 8,
  defaultRadius: "md",
  fontFamily:
    "var(--font-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
  headings: {
    fontFamily:
      "var(--font-display), var(--font-sans), ui-sans-serif, system-ui, sans-serif",
    fontWeight: "650",
  },
  colors: {
    dark: [
      "#f5f5f4",
      "#e7e5e4",
      "#d6d3d1",
      "#a8a29e",
      "#78716c",
      "#57534e",
      "#44403c",
      "#292524",
      "#1c1917",
      "#0c0a09",
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
    TextInput: {
      styles: {
        input: {
          minHeight: rem(44),
        },
      },
    },
  },
});
