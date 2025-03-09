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
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#D31F26', // Zabbix red
          600: '#be1b21',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#671e1e',
          950: '#450a0a',
        },
        secondary: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#2F3440', // Zabbix dark gray
          600: '#2a2f39',
          700: '#242932',
          800: '#1e222a',
          900: '#191c23',
          950: '#13151a',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};