import nx from '@nx/eslint-plugin';
// eslint-config-next v16 ships a native flat config (`Linter.Config[]`), so it
// is spread directly — no FlatCompat needed. `core-web-vitals` already includes
// the base `next` config.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

import baseConfig from '../../eslint.config.mjs';

// The base config and the Next flat config both register the `import` plugin;
// strip it from the Next config to avoid a flat-config "plugin redefined" error.
const removeDuplicateImportPlugin = (configArr) => {
  for (const config of configArr) {
    if (config?.plugins && config?.plugins.import) {
      delete config.plugins.import;
    }
  }
  return configArr;
};

const config = [
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  ...removeDuplicateImportPlugin([...nextCoreWebVitals]),
  {
    ignores: [
      '.next/**/*',
      'next-env.d.ts',
      'src/app/(payload)/admin/importMap.js'
    ]
  },
  {
    files: ['src/app/(payload)/**/*'],
    rules: {
      '@nx/enforce-module-boundaries': 'off'
    }
  }
];

export default config;
