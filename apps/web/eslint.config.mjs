import importPlugin from 'eslint-plugin-import';
import jsoncParser from 'jsonc-eslint-parser';

import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    plugins: { import: importPlugin }
  },
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
            // Payload
            'react-dom',
            // Remix
            '@heroicons/react',
            '@payloadcms/richtext-lexical',
            'isbot',
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
      parser: jsoncParser
    }
  }
];
