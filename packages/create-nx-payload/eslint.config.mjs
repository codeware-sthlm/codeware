import importPlugin from 'eslint-plugin-import';
import jsoncParser from 'jsonc-eslint-parser';

import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    plugins: { import: importPlugin }
  },
  {
    files: ['**/*.json'],
    rules: { '@nx/dependency-checks': 'error' },
    languageOptions: { parser: jsoncParser }
  }
];
