/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2196F3',
          light: '#64B5F6',
          dark: '#1976D2',
        },
        secondary: {
          DEFAULT: '#00BCD4',
          light: '#4DD0E1',
          dark: '#0097A7',
        },
      },
    },
  },
  plugins: [],
}
