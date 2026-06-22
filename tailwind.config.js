/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          deep:    '#0A1F3D',
          DEFAULT: '#14305C',
          mid:     '#1F4480',
          light:   '#4A6FA5',
          pale:    '#DCE4F0',
          soft:    '#F2F5FA',
        },
        gold: {
          DEFAULT: '#806014',
          light:   '#B8943A',
        },
        ink:   '#1A1D23',
        line:  '#E6EAF0',
      },
      fontFamily: {
        sans:  ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
