import { defineConfig } from 'oxlint';

/**
 * The Mantine preset (`oxc-config-mantine`) went with Mantine itself, so the
 * rules are spelled out here instead.
 *
 * supabase/functions is excluded: it is Deno, with npm:/jsr: specifiers and
 * Deno globals that oxlint resolves against the Node graph.
 */
export default defineConfig({
  plugins: ['react', 'typescript', 'unicorn'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
  },
  env: {
    browser: true,
    es2022: true,
  },
  rules: {
    // Expo Router requires a default export per route file.
    'import/no-default-export': 'off',
    // babel-preset-expo uses the automatic JSX runtime, so React does not need
    // to be in scope.
    'react/react-in-jsx-scope': 'off',
    // react-native-paper (`icon`), expo-router (`headerRight`) and
    // react-navigation (`tabBarIcon`) all take render callbacks as props. Those
    // are their documented APIs, not nested component definitions.
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
    // expo-status-bar's `style` prop is a string ("dark" | "light"), unlike the
    // DOM prop this rule is written for.
    'react/style-prop-object': 'off',
    // Deliberate in a few places, always with an explanatory comment.
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: [
    '**/*.{mjs,cjs,js,d.ts,d.mts}',
    'supabase/functions',
    '.expo',
    'dist',
  ],
});
