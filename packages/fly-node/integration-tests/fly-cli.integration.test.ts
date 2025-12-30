import { readFileSync } from 'fs';
import { join } from 'path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Fly } from '../src/lib/fly.class';
import { AppsCreateTransformedResponseSchema } from '../src/lib/schemas/apps-create.schema';
import { AppsListTransformedResponseSchema } from '../src/lib/schemas/apps-list.schema';
import { CertsListWithAppTransformedResponseSchema } from '../src/lib/schemas/certs-list-with-app.schema';
import { CertsListTransformedResponseSchema } from '../src/lib/schemas/certs-list.schema';
import { ConfigShowResponseSchema } from '../src/lib/schemas/config-show.schema';
import { SecretsListWithAppTransformedResponseSchema } from '../src/lib/schemas/secrets-list-with-app.schema';
import { SecretsListTransformedResponseSchema } from '../src/lib/schemas/secrets-list.schema';
import { StatusExtendedTransformedResponseSchema } from '../src/lib/schemas/status-extended.schema';
import { StatusTransformedResponseSchema } from '../src/lib/schemas/status.schema';
import { VersionTransformedResponseSchema } from '../src/lib/schemas/version.schema';

import {
  TEST_CONFIG,
  cleanupTestApps,
  createTestApp,
  ensureEmptyTestAppsDir,
  trackAppForCleanup,
  untrackAppForCleanup
} from './setup';

/**
 * Integration tests focused on CLI compatibility and schema validation.
 * Tests verify that all implemented commands work with the real flyctl CLI
 * and that responses match our defined Zod schemas.
 */
describe('Fly CLI Compatibility & Schema Validation', () => {
  let fly: Fly;
  let testAppName: string;
  let testAppDir: string;

  beforeAll(async () => {
    ensureEmptyTestAppsDir();

    fly = new Fly({
      authStrategy: 'token-first',
      token: TEST_CONFIG.flyApiToken,
      org: TEST_CONFIG.flyOrg
    });

    // Create a single test app shared across tests to minimize costs
    const { appName, directory } = await createTestApp(fly);
    testAppName = appName;
    testAppDir = directory;
  });

  afterAll(async () => {
    await cleanupTestApps(fly);
  });

  describe('Core Commands', () => {
    it('cli.isInstalled returns true when fly CLI is installed', async () => {
      const installed = await fly.cli.isInstalled();
      expect(installed).toBe(true);
    });

    it('cli.version returns valid response', async () => {
      const response = await fly.cli.version();

      expect(response).toBeDefined();
      VersionTransformedResponseSchema.parse(response);

      // Ensure consistent CLI version
      expect(response.version).toMatchSnapshot();
    });

    it('isReady returns true when fly CLI is available', async () => {
      const ready = await fly.isReady();
      expect(ready).toBe(true);

      await expect(fly.isReady('assert')).resolves.not.toThrow();
    });
  });

  describe('Apps Commands', () => {
    it('apps.create returns valid response', async () => {
      const response = await fly.apps.create({
        app: `test-app-create-${Date.now()}`
      });

      expect(response).toBeDefined();
      trackAppForCleanup(response.name);

      AppsCreateTransformedResponseSchema.parse(response);

      // Additional structure checks
      expect(response.id).toMatch(/^test-app-create-\d+$/);
      expect(response.name).toMatch(/^test-app-create-\d+$/);
    });

    it('apps.list returns valid response', async () => {
      const response = await fly.apps.list();

      expect(response.length).toBeGreaterThan(0);
      AppsListTransformedResponseSchema.parse(response);
    });

    it('apps.destroy executes without errors and app is removed', async () => {
      const { appName } = await createTestApp(fly);

      await expect(fly.apps.destroy(appName)).resolves.not.toThrow();

      // Verify app is actually destroyed
      await expect(fly.status({ app: appName })).resolves.toBeNull();
      untrackAppForCleanup(appName);
    });
  });

  // Currently not valueable since no certs are created during tests
  describe('Certificates Commands', () => {
    // Does Let's Encrypt provide test certs?
    it.todo('certs.add executes without errors and adds the certificate');
    it.todo('certs.remove executes without errors and removes the certificate');

    it('certs.list for app returns valid response', async () => {
      const response = await fly.certs.list({
        app: testAppName
      });

      expect(response).toBeDefined();
      CertsListTransformedResponseSchema.parse(response);
    });

    it('certs.list all returns valid response', async () => {
      const response = await fly.certs.list('all');

      expect(response).toBeDefined();
      CertsListWithAppTransformedResponseSchema.parse(response);
    });
  });

  describe('Config Commands', () => {
    it('config.show returns valid response', async () => {
      const response = await fly.config.show({
        app: testAppName
      });

      expect(response).toBeDefined();
      ConfigShowResponseSchema.parse(response);
    });

    it('config.save executes without errors and saves the config correctly', async () => {
      // json file type trigger output as JSON
      const remoteConfigFile = join(testAppDir, 'fly.remote.json');
      await expect(
        fly.config.save({
          app: testAppName,
          config: remoteConfigFile
        })
      ).resolves.not.toThrow();

      // Read the saved file and transform to api response type
      const remoteConfigFromFile = readFileSync(remoteConfigFile, 'utf-8');
      const fromFileTransformed = ConfigShowResponseSchema.parse(
        JSON.parse(remoteConfigFromFile)
      );

      // Fetch remote config
      const remoteConfigFromShow = await fly.config.show({ app: testAppName });

      expect(fromFileTransformed).toEqual(remoteConfigFromShow);
    });
  });

  // Requires existing Postgres cluster for testing
  describe('Postgres Commands', () => {
    it.todo(
      'postgres.detach executes without errors and detaches app from the cluster'
    );
  });

  describe('Secrets Commands', () => {
    it('secrets.set with deployment executes without errors', async () => {
      await expect(
        fly.secrets.set(
          { TEST_SECRET: 'test-value-123' },
          { app: testAppName, stage: false }
        )
      ).resolves.not.toThrow();
    });

    it('secrets.list for app returns valid response', async () => {
      // Ensure a secret is set for testing
      await fly.secrets.set(
        {
          API_KEY: 'key-123',
          DATABASE_URL: 'postgres://localhost'
        },
        { app: testAppName, stage: true }
      );

      const response = await fly.secrets.list({
        app: testAppName
      });

      expect(response.length).toBeGreaterThan(0);
      SecretsListTransformedResponseSchema.parse(response);
    });

    it('secrets.list all returns valid response', async () => {
      // Ensure a secret is set for testing
      await fly.secrets.set(
        {
          SECRET_LIST_ALL: 'foo-bar'
        },
        { app: testAppName, stage: true }
      );

      const response = await fly.secrets.list('all');

      expect(response.length).toBeGreaterThan(0);
      SecretsListWithAppTransformedResponseSchema.parse(response);
    });

    it('secrets.unset executes without errors and removes the secret', async () => {
      // Ensure a secret is set for testing removal
      await fly.secrets.set(
        {
          TEMP_SECRET: 'temp-value'
        },
        { app: testAppName, stage: true }
      );
      // Verify it's set
      expect(
        (await fly.secrets.list({ app: testAppName })).find(
          (s) => s.name === 'TEMP_SECRET'
        )
      ).toBeDefined();

      // Now unset it and verify removal
      await expect(
        fly.secrets.unset('TEMP_SECRET', {
          app: testAppName,
          stage: true
        })
      ).resolves.not.toThrow();
      expect(
        (await fly.secrets.list({ app: testAppName })).find(
          (s) => s.name === 'TEMP_SECRET'
        )
      ).toBeUndefined();
    });
  });

  describe('Status Commands', () => {
    it('status for app returns valid response', async () => {
      const response = await fly.status({ app: testAppName });

      expect(response).toBeDefined();
      StatusTransformedResponseSchema.parse(response);
    });

    it('statusExtended for app returns valid response', async () => {
      const response = await fly.statusExtended({ app: testAppName });

      expect(response).toBeDefined();
      StatusExtendedTransformedResponseSchema.parse(response);
    });
  });
});
