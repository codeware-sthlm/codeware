import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../../node_modules/.vite/libs/shared/feature/infisical',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'shared-feature-infisical-integration',
    globals: true,
    watch: false,
    environment: 'node',
    include: [
      'integration-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    reporters: ['default'],
    coverage: {
      reportsDirectory:
        '../../../../coverage/libs/shared/feature/infisical/integration-tests',
      provider: 'v8'
    },
    testTimeout: 30000, // 30s timeout for API calls
    setupFiles: ['integration-tests/setup.ts'],
    //pool: 'forks', // Run tests sequentially to avoid rate limits
    passWithNoTests: false
  }
});
