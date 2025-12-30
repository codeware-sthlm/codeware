import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/fly-node-integration',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'packages-fly-node-integration',
    globals: true,
    watch: false,
    environment: 'node',
    include: ['integration-tests/**/*.integration.test.ts'],
    coverage: {
      reportsDirectory: '../../coverage/packages/fly-node/integration-tests',
      provider: 'v8'
    },
    setupFiles: ['integration-tests/setup.ts'],
    passWithNoTests: false,
    // Longer timeout for real API calls and deployments
    testTimeout: 300000, // 5 minutes
    hookTimeout: 120000, // 2 minutes for deploy/destroy during setup/teardown
    // Run tests serially to avoid rate limiting and resource conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});
