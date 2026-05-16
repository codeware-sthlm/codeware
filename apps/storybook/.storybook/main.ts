import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    {
      directory: '../../../libs/app-cms/ui/dashboard/',
      files: '**/*.@(mdx|stories.@(ts|tsx))'
    },
    {
      directory: '../../../libs/shared/ui/',
      files: '**/*.@(mdx|stories.@(ts|tsx))'
    }
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-vitest'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    docsMode: false // Enable canvas mode with interactions
  },
  async viteFinal(config) {
    config.plugins = [
      ...(config.plugins ?? []),
      nxViteTsPaths(),
      tailwindcss()
    ];
    // Story files live outside Storybook's project root so Vite can't
    // auto-discover React as a CJS dep to pre-bundle. Force it explicitly.
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [...(config.optimizeDeps?.include ?? []), 'react', 'react-dom']
    };
    return config;
  }
};

export default config;
