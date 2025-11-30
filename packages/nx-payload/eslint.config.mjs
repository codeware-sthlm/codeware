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
            '@nx/eslint',
            '@nx/js',
            '@nx/next',
            'nx',
            'tslib',
            'typescript',
            'next'
          ],
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}'
          ]
        }
      ]
    },
    languageOptions: { parser: jsoncParser }
  }
];
