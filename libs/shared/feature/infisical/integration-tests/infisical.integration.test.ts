/**
 * Integration tests for Infisical
 *
 * These tests run against a real Infisical project to validate
 * the withInfisical function works correctly with the actual API.
 */

import type { Secret } from '@infisical/sdk';
import { describe, expect, it, vi } from 'vitest';

import { FolderSecrets, withInfisical } from '../src/lib/with-infisical';

// Helper to normalize secrets for snapshot comparison
type NormalizedSecret = {
  secretKey: string;
  secretValue: string;
  secretPath?: string;
};

type NormalizedFolderSecrets = {
  path: string;
  secretCount: number;
  secrets: NormalizedSecret[];
};

const normalizeSecret = ({
  secretKey,
  secretValue,
  secretPath
}: Secret): NormalizedSecret => ({
  secretKey,
  secretValue,
  secretPath
});

const normalizeSecrets = (secrets: Secret[]): NormalizedSecret[] =>
  secrets
    .map(normalizeSecret)
    .sort((a, b) => a.secretKey.localeCompare(b.secretKey));

const normalizeFolderSecrets = (
  data: FolderSecrets[]
): NormalizedFolderSecrets[] =>
  data
    .map(({ path, secrets }) => ({
      path,
      secretCount: secrets.length,
      secrets: normalizeSecrets(secrets)
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

describe('Infisical Integration Tests', () => {
  console.log = vi.fn();

  describe('Basic Secrets Fetching', () => {
    it('should fetch secrets from development environment', async () => {
      const secrets = await withInfisical({
        environment: 'development'
      });

      expect(secrets).toBeDefined();
      expect(Array.isArray(secrets)).toBe(true);
      expect(secrets.length).toBeGreaterThan(0);

      // Verify secret structure
      const firstSecret = secrets[0];
      expect(firstSecret).toHaveProperty('secretKey');
      expect(firstSecret).toHaveProperty('secretValue');
      expect(firstSecret).toHaveProperty('version');

      // Snapshot test
      const normalized = normalizeSecrets(secrets);
      expect(normalized).toMatchSnapshot('development-secrets');
    });

    it('should fetch secrets from root path', async () => {
      const secrets = await withInfisical({
        environment: 'development',
        filter: { path: '/' }
      });

      expect(secrets).toBeDefined();
      expect(Array.isArray(secrets)).toBe(true);

      const normalized = normalizeSecrets(secrets);
      expect(normalized).toMatchSnapshot('root-path-secrets');
    });

    it('should handle empty results gracefully', async () => {
      const secrets = await withInfisical({
        environment: 'development',
        filter: { path: '/empty' }
      });

      expect(secrets).toBeDefined();
      expect(Array.isArray(secrets)).toBe(true);
      expect(secrets.length).toBe(0);
    });
  });

  describe('Folder-Based Organization', () => {
    it('should group secrets by folder', async () => {
      const folderSecrets = await withInfisical({
        environment: 'development',
        groupByFolder: true
      });

      expect(folderSecrets).toBeDefined();
      expect(Array.isArray(folderSecrets)).toBe(true);
      expect(folderSecrets.length).toBeGreaterThan(0);

      // Verify structure
      const firstFolder = folderSecrets[0];
      expect(firstFolder).toHaveProperty('path');
      expect(firstFolder).toHaveProperty('secrets');
      expect(Array.isArray(firstFolder.secrets)).toBe(true);

      // Snapshot test
      const normalized = normalizeFolderSecrets(folderSecrets);
      expect(normalized).toMatchSnapshot('folder-grouped-secrets');
    });

    it('should list all folders including nested ones', async () => {
      const folderSecrets = await withInfisical({
        environment: 'development',
        groupByFolder: true
      });

      // Verify we have nested folders (e.g., /apps/cms, /apps/client)
      const paths = folderSecrets.map((f) => f.path);
      const nestedFolders = paths.filter((p) => p.split('/').length > 2);

      expect(nestedFolders.length).toBeGreaterThan(0);
      expect(paths.sort()).toMatchSnapshot('folder-paths');
    });

    it('should fetch secrets shallow from specific folder path', async () => {
      const secrets = await withInfisical({
        environment: 'development',
        filter: { path: '/apps/cms' }
      });

      expect(secrets).toBeDefined();
      expect(Array.isArray(secrets)).toBe(true);
      expect(secrets.length).toBeGreaterThan(0);

      // All secrets should be from filter path
      secrets.forEach((secret) => {
        expect(secret.secretPath).toBe('/apps/cms');
      });

      const normalized = normalizeSecrets(secrets);
      expect(normalized).toMatchSnapshot('apps-cms-folder-shallow-secrets');
    });
  });

  describe('Multi-Tenant Support', () => {
    it('should fetch secrets from tenant folders', async () => {
      const folderSecrets = await withInfisical({
        environment: 'development',
        groupByFolder: true
      });

      // Look for tenant folders
      const tenantFolders = folderSecrets.filter((f) =>
        f.path.includes('/tenants/')
      );

      // If tenant folders exist, verify structure
      if (tenantFolders.length > 0) {
        expect(tenantFolders.length).toBeGreaterThan(0);

        const tenantPaths = tenantFolders.map((f) => f.path);
        expect(tenantPaths.sort()).toMatchSnapshot('tenant-folder-paths');
      }
    });

    it('should fetch secrets from specific tenant', async () => {
      // First, get all folders to find a tenant
      const allFolders = await withInfisical({
        environment: 'development',
        groupByFolder: true
      });

      // Get first tenant folder (sorted for consistency)
      const normalizedFolders = normalizeFolderSecrets(allFolders);
      const tenantFolder = normalizedFolders.find((f) =>
        f.path.includes('/tenants/')
      );
      if (!tenantFolder) {
        expect.fail('No tenant folder found for testing');
      }

      // Fetch secrets from that tenant folder
      const tenantSecrets = await withInfisical({
        environment: 'development',
        filter: { path: tenantFolder.path }
      });

      expect(tenantSecrets).toBeDefined();
      expect(Array.isArray(tenantSecrets)).toBe(true);

      const normalized = normalizeSecrets(tenantSecrets);
      expect(normalized).toMatchSnapshot('first-tenant-secrets');
    });
  });

  describe('Path and Recursive Options', () => {
    it('should fetch secrets recursively from a path', async () => {
      const secrets = await withInfisical({
        environment: 'development',
        filter: {
          path: '/apps',
          recurse: true
        }
      });

      expect(secrets).toBeDefined();
      expect(Array.isArray(secrets)).toBe(true);

      const normalized = normalizeSecrets(secrets);
      expect(normalized).toMatchSnapshot('apps-recursive-secrets');
    });

    it('should respect non-recursive option', async () => {
      const recursiveSecrets = await withInfisical({
        environment: 'development',
        filter: { path: '/apps', recurse: true }
      });

      const nonRecursiveSecrets = await withInfisical({
        environment: 'development',
        filter: { path: '/apps', recurse: false }
      });

      // Non-recursive should have fewer or equal secrets
      expect(nonRecursiveSecrets.length).toBeLessThanOrEqual(
        recursiveSecrets.length
      );
    });
  });

  describe('Environment Support', () => {
    const environments = ['development', 'preview', 'production'] as const;

    it.each(environments)(
      'should connect to %s environment and find secrets',
      async (env) => {
        const secrets = await withInfisical({
          environment: env
        });
        expect(secrets.length).toBeGreaterThan(0);
      }
    );
  });

  describe('Error Handling', () => {
    it('should throw error with invalid credentials', async () => {
      const originalProjectId = process.env['INFISICAL_PROJECT_ID'];
      process.env['INFISICAL_PROJECT_ID'] = 'invalid-project-id';

      await expect(
        withInfisical({
          environment: 'development'
        })
      ).rejects.toThrow();

      process.env['INFISICAL_PROJECT_ID'] = originalProjectId;
    });

    it('should return null in silent mode with invalid credentials', async () => {
      const originalProjectId = process.env['INFISICAL_PROJECT_ID'];
      process.env['INFISICAL_PROJECT_ID'] = 'invalid-project-id';

      const result = await withInfisical({
        environment: 'development',
        silent: true
      });

      expect(result).toBeNull();

      process.env['INFISICAL_PROJECT_ID'] = originalProjectId;
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent secret structure', async () => {
      const secrets = await withInfisical({
        environment: 'development'
      });

      secrets.forEach((secret) => {
        expect(secret).toHaveProperty('secretKey');
        expect(secret).toHaveProperty('secretValue');
        expect(secret).toHaveProperty('version');
        expect(secret).toHaveProperty('workspace');
        expect(secret).toHaveProperty('environment');
        expect(typeof secret.secretKey).toBe('string');
        expect(typeof secret.secretValue).toBe('string');
        expect(typeof secret.version).toBe('number');
      });
    });

    it('should have matching paths in folder grouping', async () => {
      const folderSecrets = await withInfisical({
        environment: 'development',
        groupByFolder: true
      });

      folderSecrets.forEach((folder) => {
        folder.secrets.forEach((secret) => {
          // Secret path should match or be within the folder path
          if ('secretPath' in secret) {
            const secretPath = secret.secretPath as string;
            const shouldBeTrue =
              secretPath === folder.path ||
              secretPath.startsWith(folder.path) ||
              // Imported/shared secrets should have metadata workaround
              // since they may not match folder
              secret.secretMetadata?.[0]?.['key'] === 'shared';

            // Log a debug message for path mismatches
            if (!shouldBeTrue) {
              console.debug(
                `Path mismatch: folder "${folder.path}" vs secret "${secretPath}"`,
                secret
              );
            }
            expect(shouldBeTrue).toBe(true);
          }
        });
      });
    });
  });
});
