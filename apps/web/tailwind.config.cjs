const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, 'app/**/*.{js,jsx,ts,tsx}')],
  theme: {
    extend: {}
  },
  plugins: []
};
