/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'Quicksand', 'sans-serif'],
        heading: ['var(--font-quicksand)', 'Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
