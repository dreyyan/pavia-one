/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a",
        accent: "#16a34a",
      },
    },
  },
  plugins: [],
};
