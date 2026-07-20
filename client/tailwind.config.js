/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#534AB7',
          hover: '#453d9e',
          light: '#ece9f9',
          border: '#e2ddf6',
        },
      },
      fontFamily: {
        sans: ["'Public Sans'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

