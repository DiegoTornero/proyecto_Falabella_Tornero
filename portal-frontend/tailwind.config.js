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
          verde: '#00a651',
          oscuro: '#1a3c2b',
          claro: '#f5f5f5',
        }
      }
    },
  },
  plugins: [],
}