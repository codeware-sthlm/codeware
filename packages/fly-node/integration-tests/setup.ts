import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

import dotenv from 'dotenv';
import isCI from 'is-ci';
import { z } from 'zod';

import { Fly } from '../src/lib/fly.class';

const coerceBoolean = z.preprocess(
  (val) =>
    typeof val === 'string' ? val.trim().toLowerCase() === 'true' : false,
  z.boolean()
);

const IntegrationTestEnvSchema = z.object({
  FLY_TEST_API_TOKEN: z.string().min(1),
  FLY_TEST_ORG: z.string().min(1),
  FLY_TEST_TRACE_CLI: coerceBoolean.optional(),
  FLY_TEST_POSTGRES: z.string().optional(),
  FLY_CLI_VERSION: z.string().optional().default('latest')
});

console.log('🔧 Setting up Fly-Node integration tests...');

if (!isCI) {
  console.log('💡 Running in local environment, loading env file...');
  const status = dotenv.config({ path: `${__dirname}/../.env.test.local` });
  if (status.error) {
    console.warn(
      '⚠️  .env.test.local file not found. Make sure to create it for local testing.'
    );
  }
}

// Validate environment
const envValidation = IntegrationTestEnvSchema.safeParse(process.env);

if (!envValidation.success) {
  console.error(
    `❌ Missing required environment variables for integration tests
Required:
  - FLY_TEST_API_TOKEN
  - FLY_TEST_ORG
Optional: FLY_TEST_POSTGRES, FLY_CLI_VERSION
Errors:
${JSON.stringify(envValidation.error.flatten().fieldErrors, null, 2)}
`
  );
  process.exit(1);
}

const env = envValidation.data;

// Track created apps for cleanup
const createdApps: string[] = [];

/**
 * Create a Fly client instance for tests.
 *
 * Use one of the following authentication methods:
 * - `'FLY_ACCESS_TOKEN'`: Sets `FLY_ACCESS_TOKEN` env var
 * - `'FLY_API_TOKEN'`: Sets `FLY_API_TOKEN` env var
 * - `'config-token'`: Passes token via config optional parameter
 * - `'none'`: No authentication (expected to fail on authenticated calls)
 *
 * @param auth - Authentication method
 * @return Fly client instance
 */
export const createFly = (
  auth: 'FLY_ACCESS_TOKEN' | 'FLY_API_TOKEN' | 'config-token' | 'none'
): Fly => {
  delete process.env['FLY_ACCESS_TOKEN'];
  delete process.env['FLY_API_TOKEN'];

  if (auth === 'FLY_ACCESS_TOKEN') {
    process.env['FLY_ACCESS_TOKEN'] = env.FLY_TEST_API_TOKEN;
  } else if (auth === 'FLY_API_TOKEN') {
    process.env['FLY_API_TOKEN'] = env.FLY_TEST_API_TOKEN;
  }

  return new Fly({
    token: auth === 'config-token' ? env.FLY_TEST_API_TOKEN : undefined,
    org: env.FLY_TEST_ORG,
    logger: {
      // Suppress routine info logs — vitest prints the test name as a header
      // for every console.log call, which makes the test names appear spammed.
      info: () => undefined,
      traceCLI: env.FLY_TEST_TRACE_CLI
    }
  });
};

/**
 * Create and deploy a minimal test app with Dockerfile and fly.toml
 * @param fly - An initialized Fly client instance
 * @returns The created app name and directory
 */
export const createTestApp = async (
  fly: Fly,
  options: { build: 'dockerfile' | 'image'; deploy: boolean } = {
    build: 'image',
    deploy: true
  }
) => {
  const { build, deploy } = options;
  const testApp = `test-app-${Date.now()}`;
  const testRelativeDir = join('integration-tests', '__test-apps__', testApp);
  const testDir = join(__dirname, '__test-apps__', testApp);

  mkdirSync(testDir, { recursive: true });

  if (build === 'dockerfile') {
    // Dockerfile-based app so `fly deploy --build-only` triggers a real Docker
    // build and pushes the image to registry.fly.io
    writeFileSync(
      join(testDir, 'Dockerfile'),
      `FROM hashicorp/http-echo:latest\n`
    );
  }

  // Create fly.toml (using pre-built image instead of Dockerfile)
  const flyToml = `
app = "${testApp}"
primary_region = "arn"

[build]
  ${build === 'dockerfile' ? 'dockerfile = "Dockerfile"' : 'image = "hashicorp/http-echo"'}

[http_service]
  internal_port = 5678
  force_https = true
  auto_stop_machines = "suspend"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
`;
  const configFile = join(testRelativeDir, 'fly.toml');
  writeFileSync(configFile, flyToml);

  // Create app first to track for cleanup, in case deploy fails
  const { name } = await fly.apps.create({ app: testApp });
  console.log(`🆕 [ setup ] Created test app '${name}'`);
  createdApps.push(name);

  // Deploy the app if deploy option is true (can be skipped for testing build-only)
  if (deploy) {
    const { url } = await fly.deploy({ config: configFile });
    console.log(`🚀 [ setup ] Deployed test app '${name}' at ${url}`);
  } else {
    console.log(`⚡ [ setup ] Skipped deploying test app '${name}'`);
  }

  return { appName: name, configFile, directory: testDir };
};

/**
 * Cleanup all created and tracked test apps
 * @param fly - An initialized Fly client instance
 */
export const cleanupTestApps = async (fly: Fly) => {
  console.log(`🧹 [ cleanup ] ${createdApps.length} test apps...`);
  for (const app of createdApps) {
    try {
      await fly.apps.destroy(app);
      console.log(`🗑️ [ cleanup ] Destroyed test app '${app}'`);
    } catch (error) {
      console.warn(`⚠️ [ cleanup ] Failed to cleanup app '${app}':`, error);
    }
  }
  createdApps.length = 0;
};

/**
 * Ensure the test apps directory is empty
 */
export const ensureEmptyTestAppsDir = () => {
  const testAppsDir = join(__dirname, '__test-apps__');
  rmSync(testAppsDir, { recursive: true, force: true });
  mkdirSync(testAppsDir, { recursive: true });
};

/**
 * Track an app for cleanup after tests when app is created outside of helpers
 * @param app - The app name to track
 */
export const trackAppForCleanup = (app: string) => {
  createdApps.push(app);
};

/**
 * Untrack an app from cleanup if it has been destroyed during tests
 * @param app - The app name to untrack
 */
export const untrackAppForCleanup = (app: string) => {
  const index = createdApps.indexOf(app);
  if (index !== -1) {
    createdApps.splice(index, 1);
    console.log(`⚠️ [ cleanup ] Untracked test app '${app}'`);
  }
};
