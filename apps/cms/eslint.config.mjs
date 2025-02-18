import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';

import baseConfig from '../../eslint.config.mjs';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended
});

const removeDuplicateImportPlugin = (configArr) => {
  for (const config of configArr) {
    if (config?.plugins && config?.plugins.import) {
      delete config.plugins.import;
    }
  }
  return configArr;
};

const nextPlugins = [
  ...fixupConfigRules(compat.extends('next')),
  ...fixupConfigRules(compat.extends('next/core-web-vitals'))
];

const config = [
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  ...removeDuplicateImportPlugin(nextPlugins),
  {
    ignores: ['.next/**/*']
  },
  {
    files: ['src/app/(payload)/**/*'],
    rules: {
      '@nx/enforce-module-boundaries': 'off'
    }
  }
];

export default config;
