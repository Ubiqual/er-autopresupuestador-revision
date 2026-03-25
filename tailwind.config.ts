import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        verdana: ['Verdana', 'sans-serif']
      },
      fontSize: {
        base: '1rem'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
export default config;
