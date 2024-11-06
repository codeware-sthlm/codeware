const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {}
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {}
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {}
  },
  {
    files: ['**/*.json'],
    rules: { '@nx/dependency-checks': 'error' },
    languageOptions: { parser: require('jsonc-eslint-parser') }
  }
];
