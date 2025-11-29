import jsoncParser from 'jsonc-eslint-parser';

import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  { ignores: ['src/generators/**/files/**'] },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {}
  },
  {
    files: [
      './package.json',
      './executors.json',
      './generators.json',
      './migrations.json'
    ],
    rules: { '@nx/nx-plugin-checks': 'error' },
    languageOptions: {
      parser: jsoncParser
    }
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            // Dev dependencies
            '@nx/eslint',
            '@nx/js',
            '@nx/next',
            'nx',
            'tslib',
            'typescript',
            // Required by inferred targets
            'next'
          ]
        }
      ]
    },
    languageOptions: { parser: jsoncParser }
  }
];
