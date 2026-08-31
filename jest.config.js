/**
 * Covers the pure TypeScript in lib/ only — validation helpers and the home-code
 * rules. Those have no React Native or Expo imports, so plain ts-jest is enough
 * and we avoid pulling in jest-expo and a native module mock surface for three
 * test files.
 *
 * Add jest-expo as a second project if component tests are ever introduced.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-jsx',
          esModuleInterop: true,
          isolatedModules: true,
          rootDir: '.',
        },
      },
    ],
  },
  // supabase/functions is Deno: npm:/jsr: specifiers and Deno globals that
  // node-based Jest cannot resolve.
  testPathIgnorePatterns: ['/node_modules/', '/supabase/', '/.expo/'],
};
