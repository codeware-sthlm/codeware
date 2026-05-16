import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';

import baseConfig from '../../eslint.config.mjs';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended
});

export default [
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  {
    ignores: ['storybook-static/**/*']
  }
];
