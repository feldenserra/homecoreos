import type { DefaultMantineColor, MantineColorsTuple } from "@mantine/core";

type ExtendedDefaultColors = "clay" | DefaultMantineColor;

declare module "@mantine/core" {
  export interface MantineThemeColorsOverride {
    colors: Record<ExtendedDefaultColors, MantineColorsTuple>;
  }
}
