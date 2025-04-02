import importPlugin from 'eslint-plugin-import';
import jsoncParser from 'jsonc-eslint-parser';

import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    plugins: { import: importPlugin }
  },
  {
    ignores: ['**/build', '**/server.js', '**/vitest.config.ts.timestamp*']
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            // Loading secrets
            '@infisical/sdk',
            // Payload
            'react-dom',
            // Remix
            'isbot',
            // Payload components
            '@heroicons/react',
            '@payloadcms/richtext-lexical',
            'prism-react-renderer',
            // Payload components - Tailwind/Shadcn
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'lucide-react',
            'next-themes',
            'react-hook-form',
            'sonner',
            'tailwind-merge',
            'tailwindcss-animate',
            // Dev dependencies
            '@nx/vite',
            '@remix-run/testing',
            '@testing-library/jest-dom',
            '@testing-library/react',
            '@vitejs/plugin-react',
            'jsonc-eslint-parser',
            'vite'
          ],
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
