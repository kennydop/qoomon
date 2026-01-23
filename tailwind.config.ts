import type { Config } from 'tailwindcss';

const purpleScale = {
  50: 'oklch(0.977 0.014 308.299)',
  100: 'oklch(0.946 0.033 307.174)',
  200: 'oklch(0.902 0.063 306.703)',
  300: 'oklch(0.827 0.119 306.383)',
  400: 'oklch(0.714 0.203 305.504)',
  500: 'oklch(0.627 0.265 303.9)',
  600: 'oklch(0.558 0.288 302.321)',
  700: 'oklch(0.496 0.265 301.924)',
  800: 'oklch(0.438 0.218 303.724)',
  900: 'oklch(0.381 0.176 304.987)',
  950: 'oklch(0.291 0.149 302.717)',
};

const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Mirrored from src/styles/globals.css @theme palette
        primary: purpleScale,
        secondary: purpleScale,
        accent: purpleScale,
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config;

export default config;
