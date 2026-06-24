/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        falabella: {
          verde:    '#00a651',
          oscuro:   '#00361f',
          medio:    '#00693c',
          claro:    '#f4f6f0',
          lima:     '#c8e000',
        }
      },
      fontFamily: {
        sans:   ['DM Sans', 'system-ui', 'sans-serif'],
        serif:  ['DM Serif Display', 'serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card:   '0 4px 24px rgba(0,54,31,0.07)',
        float:  '0 12px 40px rgba(0,54,31,0.14)',
        lime:   '0 8px 24px rgba(200,224,0,0.35)',
      },
    },
  },
  plugins: [],
}