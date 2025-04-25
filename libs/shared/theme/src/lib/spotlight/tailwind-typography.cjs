const base = require('../core/typography-base');
const prose = require('../core/typography-prose');

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
