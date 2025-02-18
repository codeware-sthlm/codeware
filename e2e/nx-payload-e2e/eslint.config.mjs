import jsoncParser from 'jsonc-eslint-parser';

import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: { '@nx/dependency-checks': 'error' },
    languageOptions: { parser: jsoncParser }
  }
];
