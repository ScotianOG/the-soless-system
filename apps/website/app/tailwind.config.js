/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'soless-dark': '#000000',
        'soless-blue': '#00ffff',
        'soless-purple': '#9945FF',
      },
      fontFamily: {
        space: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};