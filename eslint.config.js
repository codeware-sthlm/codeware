const nx = require('@nx/eslint-plugin');
const eslintPluginImport = require('eslint-plugin-import');

module.exports = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    plugins: {
      import: eslintPluginImport
    }
  },
  {
    ignores: ['**/dist', '**/vite.config.[cm]?ts.timestamp-*.[cm]js']
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util']
            },
            {
              sourceTag: 'scope:packages',
              onlyDependOnLibsWithTags: ['scope:packages']
            },
            {
              sourceTag: 'scope:cms',
              onlyDependOnLibsWithTags: [
                'scope:app-cms',
                'scope:cms',
                'scope:core',
                'scope:shared',
                'domain:signature'
              ]
            },
            {
              sourceTag: 'scope:app-cms',
              onlyDependOnLibsWithTags: ['scope:app-cms', 'scope:shared']
            },
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: [
                'scope:web',
                'scope:shared',
                'domain:signature'
              ]
            },
            {
              sourceTag: 'scope:core',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:shared']
            },
            {
              sourceTag: 'scope:create-nx-payload',
              onlyDependOnLibsWithTags: [
                'scope:create-nx-payload',
                'scope:core',
                'scope:shared'
              ]
            },
            {
              sourceTag: 'scope:deploy-env-action',
              onlyDependOnLibsWithTags: [
                'scope:deploy-env-action',
                'scope:core',
                'scope:shared'
              ]
            },
            {
              sourceTag: 'scope:e2e-utils',
              onlyDependOnLibsWithTags: [
                'scope:e2e-utils',
                'scope:core',
                'scope:shared'
              ]
            },
            {
              sourceTag: 'scope:fly-node',
              onlyDependOnLibsWithTags: [
                'scope:fly-node',
                'scope:core',
                'scope:shared'
              ]
            },
            {
              sourceTag: 'scope:nx-fly-deployment-action',
              onlyDependOnLibsWithTags: [
                'scope:nx-fly-deployment-action',
                'scope:core',
                'scope:fly-node',
                'scope:shared'
              ]
            },
            {
              sourceTag: 'scope:nx-migrate-action',
              onlyDependOnLibsWithTags: [
                'scope:nx-migrate-action',
                'scope:core',
                'scope:shared'
              ]
            },
            {
              sourceTag: 'scope:nx-payload',
              onlyDependOnLibsWithTags: [
                'scope:nx-payload',
                'scope:core',
                'scope:shared'
              ]
            },
            {
              sourceTag: 'scope:nx-payload-e2e',
              onlyDependOnLibsWithTags: [
                'scope:nx-payload-e2e',
                'scope:core',
                'scope:e2e-utils',
                'scope:shared'
              ]
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:core']
            }
          ]
        }
      ],
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true
        }
      ],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['sibling', 'parent'],
            'index',
            'unknown'
          ],
          pathGroups: [
            {
              pattern: './**',
              group: 'index',
              position: 'after'
            }
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {}
  }
];
