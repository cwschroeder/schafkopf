/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'schafkopf': {
          'green': '#1a472a',
          'felt': '#2d5a3d',
          'gold': '#d4af37',
        }
      }
    },
  },
  plugins: [],
}
