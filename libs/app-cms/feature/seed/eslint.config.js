const baseConfig = require('../../../../eslint.config.js');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: require('jsonc-eslint-parser')
    }
  }
];
