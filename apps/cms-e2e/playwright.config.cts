import { readFileSync } from 'fs';
import { resolve } from 'path';

import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';
import { parse as parseEnv } from 'dotenv';

// Load e2e environment overrides and apply them to the current process so they're
// inherited by all child processes (webServer, coverage, etc.) regardless of
// which executor or e2e target variant is used.
const e2eEnv = parseEnv(
  readFileSync(resolve(workspaceRoot, 'apps/cms-e2e/.env.e2e'))
);
Object.assign(process.env, e2eEnv);

const baseURL = process.env['BASE_URL'] || 'http://localhost:3000';

export default defineConfig({
  ...nxE2EPreset(__dirname, { testDir: './src' }),
  // Admin tests drive the Payload UI and are prone to timing flakiness.
  // Permission and API tests are deterministic and always run in CI.
  testIgnore: process.env['CI'] ? ['**/admin/**'] : [],
  globalSetup: require.resolve('./global-setup.cts'),
  globalTeardown: require.resolve('./global-teardown.cts'),
  // Ensure tests run serially to avoid
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'pnpm exec nx run cms:dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: workspaceRoot,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
