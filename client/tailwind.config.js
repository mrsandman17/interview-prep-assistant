/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'problem-gray': '#6B7280',
        'problem-orange': '#F97316',
        'problem-yellow': '#EAB308',
        'problem-green': '#22C55E',
      },
    },
  },
  plugins: [],
}
