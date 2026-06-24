/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          50: '#f2fcf5',
          100: '#e1f8e8',
          500: '#00a651',
          600: '#008a43',
          900: '#0a1f14',
          'accent': '#c8e000'
        }
      }
    },
  },
  plugins: [],
}
