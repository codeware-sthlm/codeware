const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  {
    ignores: ['**/build', '**/vitest.config.ts.timestamp*']
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            '@cdwr/core',
            '@nx/vite',
            '@remix-run/testing',
            '@testing-library/jest-dom',
            '@testing-library/react',
            '@vitejs/plugin-react',
            'vite'
          ],
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}'
          ]
        }
      ]
    },
    languageOptions: {
      parser: require('jsonc-eslint-parser')
    }
  }
];
