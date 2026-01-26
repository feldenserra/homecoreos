/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // 1. Add these two for Mantine to work
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },

    // 2. Keep your existing Tailwind setup here
    "@tailwindcss/postcss": {},
  },
};

export default config;
