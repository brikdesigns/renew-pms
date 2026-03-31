import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './brik-bds/components/**/*.{js,ts,jsx,tsx}',
    './content/**/*.mdx',
    './mdx-components.tsx',
  ],
  theme: {
    extend: {
      colors: {
        // Brik brand colors
        'brik-blue': '#4665f5',
        'brik-green': '#79d799',
        'brik-yellow': '#f6c647',
        // Renew PMS brand colors (TBD — placeholders)
        'renew-primary': '#4665f5',
        'renew-secondary': '#79d799',
        'renew-accent': '#f6c647',
      },
    },
  },
  plugins: [],
};

export default config;
