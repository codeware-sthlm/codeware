import jsoncParser from 'jsonc-eslint-parser';

import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: ['@cdwr/core', '@cdwr/fly-node'],
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
