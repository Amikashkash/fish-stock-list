/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ocean Blue - Primary color for main actions
        ocean: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#1E88E5', // Main
          600: '#1976D2',
          700: '#1565C0',
          800: '#0D47A1',
          900: '#0A3D91',
        },
        // Coral - Secondary color for accents
        coral: {
          50: '#FFE8E8',
          100: '#FFBDBD',
          200: '#FF9292',
          300: '#FF6B6B', // Main
          400: '#FF5252',
          500: '#F44336',
          600: '#E53935',
          700: '#D32F2F',
          800: '#C62828',
          900: '#B71C1C',
        },
        // Sunset Orange - Accent color
        sunset: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726', // Main
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        // Aqua - For backgrounds and soft accents
        aqua: {
          50: '#F5F7FA',
          100: '#E8F0F7',
          200: '#D4E6F1',
          300: '#AED6F1',
          400: '#85C1E9',
          500: '#5DADE2',
          600: '#3498DB',
          700: '#2E86C1',
          800: '#2874A6',
          900: '#21618C',
        },
        // Keep existing for backwards compatibility
        primary: {
          DEFAULT: '#1E88E5',
          light: '#42A5F5',
          dark: '#1565C0',
        },
        secondary: {
          DEFAULT: '#FF6B6B',
          light: '#FF9292',
          dark: '#F44336',
        },
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(10px) translateY(-5px)' },
          '50%': { transform: 'translateX(0) translateY(-10px)' },
          '75%': { transform: 'translateX(-10px) translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        wave: 'wave 4s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'card': '0 4px 20px rgba(30, 136, 229, 0.1)',
        'card-hover': '0 8px 30px rgba(30, 136, 229, 0.15)',
      },
    },
  },
  plugins: [],
}
