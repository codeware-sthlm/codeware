const { join } = require('path');

const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    colors: {
      //transparent: colors.transparent,
      current: 'currentColor',
      //white: colors.white,
      blue: {
        steel: '#588bae',
        yale: '#0e4d92',
        space: '#1d2951'
      },
      gray: {
        light: '#d0d2d3'
      },
      eerie: '#242526'
    },
    container: {
      center: true
    },
    fontFamily: {
      nasarg: ['nasalization-rg', 'sans-serif']
    },
    extend: {
      letterSpacing: {
        sthlm: '1.25em'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')],
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname)
  ]
};
