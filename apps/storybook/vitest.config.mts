import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// addon-vitest disables axe by default; opt-in so that `parameters.a11y.test: 'error'`
// (set by a11yStory) actually fails tests — matching Chromatic's behaviour.
process.env['VITEST_STORYBOOK_CONFIG'] = JSON.stringify({ a11y: true });

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    storybookTest({
      configDir: path.join(dirname, '.storybook')
    })
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-dev-runtime',
      // Pulls in CJS-only deps (aria-query, lz-string) that would otherwise be
      // served raw and fail their ESM named imports. Pre-bundling the parent
      // inlines them; listing them directly doesn't work since pnpm keeps them
      // unresolvable from the workspace root.
      '@testing-library/dom'
    ]
  },
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }]
    },
    watch: false
  }
});
