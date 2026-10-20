/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--base) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        mute: 'rgb(var(--mute) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        violet: { DEFAULT: '#8B5CF6', deep: '#6D3FE0' },
        cyan: { DEFAULT: '#22D3EE' },
        emerald: { DEFAULT: '#34D399' },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
