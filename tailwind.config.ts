import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      colors: {
        lime: {
          DEFAULT: '#C8F65D',
          dark: '#B5E34A',
        },
        dark: {
          bg: '#070A07',
          card: '#0B0F0C',
        },
      },
    },
  },
  plugins: [],
}
export default config
