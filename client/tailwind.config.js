/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        utsav: {
          saffron: {
            50: '#fff7ed',
            100: '#ffedd5',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12'
          },
          marigold: {
            50: '#fefce8',
            100: '#fef9c3',
            400: '#facc15',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207'
          },
          indigo: {
            50: '#eef2ff',
            100: '#e0e7ff',
            700: '#3730a3',
            800: '#312e81',
            900: '#1e1b4b'
          },
          emerald: {
            50: '#ecfdf5',
            100: '#d1fae5',
            700: '#047857',
            800: '#065f46'
          },
          cream: {
            50: '#faf8f5',
            100: '#f5f0e8',
            200: '#ebe3d5',
            800: '#4a443c',
            900: '#2c2722'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Georgia', 'serif']
      }
    },
  },
  plugins: [],
}
