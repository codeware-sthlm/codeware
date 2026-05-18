const base = require('./typography-base');
const prose = require('./typography-prose');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            ...prose,
            ...base({ theme })
          }
        },
        invert: {
          css: {
            ...prose
          }
        }
      })
    }
  }
};
