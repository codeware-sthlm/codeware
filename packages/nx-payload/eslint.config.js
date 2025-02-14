const baseConfig = require('../../eslint.config.js');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
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
      parser: require('jsonc-eslint-parser')
    }
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            // Plugin dependencies
            'next',
            'payload',
            'react',
            'react-dom',
            // Installed by the plugin
            '@nx/eslint',
            '@nx/js',
            '@nx/next',
            // Workspace native
            'nx',
            'tslib',
            'typescript'
          ]
        }
      ]
    },
    languageOptions: { parser: require('jsonc-eslint-parser') }
  }
];
