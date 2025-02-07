const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  {
    ignores: ['**/build', '**/server.js', '**/vitest.config.ts.timestamp*']
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            // Loading secrets
            '@infisical/sdk',
            // Payload lexical dynamic components
            'lexical',
            'prism-react-renderer',
            // Dev dependencies
            '@nx/vite',
            '@remix-run/testing',
            '@testing-library/jest-dom',
            '@testing-library/react',
            '@vitejs/plugin-react',
            'jsonc-eslint-parser',
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
