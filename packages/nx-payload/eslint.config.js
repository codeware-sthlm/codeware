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
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            'react',
            'react-i18next',
            'react-router-dom',
            'rimraf'
          ]
        }
      ]
    },
    languageOptions: { parser: require('jsonc-eslint-parser') }
  },
  {
    files: ['./package.json', './executors.json', './generators.json'],
    rules: { '@nx/nx-plugin-checks': 'error' },
    languageOptions: { parser: require('jsonc-eslint-parser') }
  }
];
