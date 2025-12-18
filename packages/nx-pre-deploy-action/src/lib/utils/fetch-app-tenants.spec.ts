import * as core from '@actions/core';
import * as infisicalModule from '@codeware/shared/feature/infisical';

import type { InfisicalConfig } from '../schemas/config.schema';

import { fetchAppTenants } from './fetch-app-tenants';

vi.mock('@actions/core');
vi.mock('@codeware/shared/feature/infisical');

type FolderSecret = Partial<infisicalModule.FolderSecrets['secrets'][number]>;

describe('fetchAppTenants', () => {
  let mockWithInfisical: ReturnType<typeof vi.fn>;

  const defaultConfig: InfisicalConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    environment: 'production',
    projectId: 'test-project-id',
    site: 'eu'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock withInfisical to return empty folder secrets by default
    mockWithInfisical = vi.fn().mockResolvedValue([]);

    vi.mocked(infisicalModule.withInfisical).mockImplementation(
      mockWithInfisical as never
    );
  });

  describe('initialization', () => {
    it('should return empty map when no apps provided', async () => {
      const result = await fetchAppTenants(defaultConfig, []);

      expect(result).toEqual({});
      expect(core.info).toHaveBeenCalledWith(
        '[fetch-app-tenants] No apps provided, skipping tenant fetch'
      );
      expect(mockWithInfisical).not.toHaveBeenCalled();
    });

    it('should call withInfisical with EU site', async () => {
      await fetchAppTenants(defaultConfig, ['app1']);

      expect(mockWithInfisical).toHaveBeenCalledWith(
        expect.objectContaining({
          site: 'eu'
        })
      );
    });

    it('should call withInfisical with US site', async () => {
      const usConfig = { ...defaultConfig, site: 'us' } as InfisicalConfig;
      await fetchAppTenants(usConfig, ['app1']);

      expect(mockWithInfisical).toHaveBeenCalledWith(
        expect.objectContaining({
          site: 'us'
        })
      );
    });

    it('should call withInfisical with correct parameters', async () => {
      await fetchAppTenants(defaultConfig, ['app1']);

      expect(mockWithInfisical).toHaveBeenCalledWith(
        expect.objectContaining({
          site: 'eu',
          environment: 'production',
          filter: {
            path: '/tenants',
            recurse: true
          }
        })
      );
    });
  });

  describe('fetching tenant configuration', () => {
    it('should fetch secrets from /tenants/ path recursively', async () => {
      await fetchAppTenants(defaultConfig, ['web', 'api']);

      expect(mockWithInfisical).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'production',
          filter: {
            path: '/tenants',
            recurse: true
          }
        })
      );
    });

    it('should discover tenants by parsing folder paths', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/tenant1/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant1.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/tenant2/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant2.example.com',
              secretMetadata: []
            }
          ]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, ['web']);

      expect(result).toEqual({
        web: [
          {
            tenant: 'tenant1',
            secrets: {
              PUBLIC_URL: 'https://tenant1.example.com'
            }
          },
          {
            tenant: 'tenant2',
            secrets: {
              PUBLIC_URL: 'https://tenant2.example.com'
            }
          }
        ]
      });
      expect(core.info).toHaveBeenCalledWith(
        "[fetch-app-tenants] Discovered: tenant 'tenant1' uses app 'web' (0 env, 1 secrets)"
      );
      expect(core.info).toHaveBeenCalledWith(
        "[fetch-app-tenants] Discovered: tenant 'tenant2' uses app 'web' (0 env, 1 secrets)"
      );
    });

    it('should ignore common tenant secrets', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants',
          secrets: [
            {
              secretKey: 'SHARED_KEY',
              secretValue: 'supersecret',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/tenant1/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant1.example.com',
              secretMetadata: []
            }
          ]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, ['web']);

      expect(result).toEqual({
        web: [
          {
            tenant: 'tenant1',
            secrets: {
              PUBLIC_URL: 'https://tenant1.example.com'
            }
          }
        ]
      });
    });

    it('should classify secrets by secretMetadata.env flag', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/tenant1/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant1.example.com',
              secretMetadata: [{ foo: 'bar' }, { env: true }]
            },
            {
              secretKey: 'API_KEY',
              secretValue: 'secret-key-123',
              secretMetadata: [{ env: false }]
            },
            {
              secretKey: 'DATABASE_URL',
              secretValue: 'postgres://...',
              secretMetadata: []
            },
            {
              secretKey: 'NEXT_PUBLIC_APP_NAME',
              secretValue: 'My App',
              secretMetadata: [{ env: true }]
            }
          ] satisfies FolderSecret[]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, ['web']);

      expect(result).toEqual({
        web: [
          {
            tenant: 'tenant1',
            env: {
              PUBLIC_URL: 'https://tenant1.example.com',
              NEXT_PUBLIC_APP_NAME: 'My App'
            },
            secrets: {
              API_KEY: 'secret-key-123',
              DATABASE_URL: 'postgres://...'
            }
          }
        ]
      });
      expect(core.info).toHaveBeenCalledWith(
        "[fetch-app-tenants] Discovered: tenant 'tenant1' uses app 'web' (2 env, 2 secrets)"
      );
    });

    it('should handle app with no tenant folders', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/tenant1/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant1.example.com',
              secretMetadata: []
            }
          ]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, ['cms']);

      expect(result).toEqual({
        cms: []
      });
      expect(core.info).toHaveBeenCalledWith(
        '  - cms: single-tenant (no multi-tenancy)'
      );
    });

    it('should handle empty /tenants/ path', async () => {
      // Default mock already returns empty folder array

      const result = await fetchAppTenants(defaultConfig, ['web', 'api']);

      expect(result).toEqual({
        web: [],
        api: []
      });
      expect(core.info).toHaveBeenCalledWith(
        '[fetch-app-tenants] No tenant structure found, treating all apps as single-tenant'
      );
    });

    it('should ignore folders not matching tenant-app pattern', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/tenant1', // No /apps/ in path
          secrets: [
            {
              secretKey: 'SOME_SECRET',
              secretValue: 'value',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/tenant1/apps/web', // Valid pattern
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant1.example.com',
              secretMetadata: []
            }
          ]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, ['web']);

      expect(result).toEqual({
        web: [
          {
            tenant: 'tenant1',
            secrets: { PUBLIC_URL: 'https://tenant1.example.com' }
          }
        ]
      });
    });
  });

  describe('validation and error handling', () => {
    it('should only track tenants for requested apps', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/tenant1/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant1.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/tenant1/apps/api',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant1-api.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/tenant2/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant2.example.com',
              secretMetadata: []
            }
          ]
        }
      ]);

      // Only request 'web' app
      const result = await fetchAppTenants(defaultConfig, ['web']);

      expect(result).toEqual({
        web: [
          {
            tenant: 'tenant1',
            secrets: { PUBLIC_URL: 'https://tenant1.example.com' }
          },
          {
            tenant: 'tenant2',
            secrets: { PUBLIC_URL: 'https://tenant2.example.com' }
          }
        ]
      });
      // tenant1's api should not be tracked
    });

    it('should handle folder with multiple secrets', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/tenant1/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://tenant1.example.com',
              secretMetadata: []
            },
            {
              secretKey: 'CMS_URL',
              secretValue: 'https://cms.example.com',
              secretMetadata: []
            },
            {
              secretKey: 'ANOTHER_SECRET',
              secretValue: 'value',
              secretMetadata: []
            }
          ]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, ['web']);

      expect(result).toEqual({
        web: [
          {
            tenant: 'tenant1',
            secrets: {
              PUBLIC_URL: 'https://tenant1.example.com',
              CMS_URL: 'https://cms.example.com',
              ANOTHER_SECRET: 'value'
            }
          }
        ]
      });
      // Should only log discovery once per tenant-app combination
      expect(core.info).toHaveBeenCalledWith(
        "[fetch-app-tenants] Discovered: tenant 'tenant1' uses app 'web' (0 env, 3 secrets)"
      );
      // Total calls: connection (1) + folders found (1) + discovery (1) + summary (4) = 7
      expect(core.info).toHaveBeenCalledTimes(7);
    });

    it('should sort tenant lists alphabetically', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/zebra/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'url',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/alpha/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'url',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/charlie/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'url',
              secretMetadata: []
            }
          ]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, ['web']);

      expect(result).toEqual({
        web: [
          {
            tenant: 'alpha',
            secrets: { PUBLIC_URL: 'url' }
          },
          {
            tenant: 'charlie',
            secrets: { PUBLIC_URL: 'url' }
          },
          {
            tenant: 'zebra',
            secrets: { PUBLIC_URL: 'url' }
          }
        ]
      });
    });

    it('should handle error when fetching /tenants/ path', async () => {
      // Default mock already returns empty secrets, which is handled gracefully

      const result = await fetchAppTenants(defaultConfig, ['web', 'api']);

      expect(result).toEqual({
        web: [],
        api: []
      });
      expect(core.info).toHaveBeenCalledWith(
        '[fetch-app-tenants] No tenant structure found, treating all apps as single-tenant'
      );
    });

    it('should throw error when authentication fails', async () => {
      mockWithInfisical.mockRejectedValue(new Error('Invalid credentials'));

      await expect(fetchAppTenants(defaultConfig, ['web'])).rejects.toThrow(
        'Invalid credentials'
      );

      expect(core.error).toHaveBeenCalledWith(
        '[fetch-app-tenants] Error: Invalid credentials'
      );
    });

    it('should log error cause when available', async () => {
      const errorWithCause = new Error('Auth failed');
      (errorWithCause as Error & { cause?: unknown }).cause = {
        code: 'INVALID_TOKEN'
      };

      mockWithInfisical.mockRejectedValue(errorWithCause);

      await expect(fetchAppTenants(defaultConfig, ['web'])).rejects.toThrow(
        'Auth failed'
      );

      expect(core.error).toHaveBeenCalledWith(
        '[fetch-app-tenants] Cause: {"code":"INVALID_TOKEN"}'
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockWithInfisical.mockRejectedValue('string error');

      await expect(fetchAppTenants(defaultConfig, ['web'])).rejects.toBe(
        'string error'
      );

      expect(core.error).toHaveBeenCalledWith(
        '[fetch-app-tenants] Unknown error: "string error"'
      );
    });
  });

  describe('multi-app scenarios', () => {
    it('should fetch tenants for multiple apps with mixed configurations', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/demo/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'url1',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/customer1/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'url2',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/customer2/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'url3',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/demo/apps/api',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'url4',
              secretMetadata: []
            }
          ]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, [
        'web',
        'cms',
        'api'
      ]);

      expect(result).toEqual({
        web: [
          { tenant: 'customer1', secrets: { PUBLIC_URL: 'url2' } },
          { tenant: 'customer2', secrets: { PUBLIC_URL: 'url3' } },
          { tenant: 'demo', secrets: { PUBLIC_URL: 'url1' } }
        ],
        cms: [],
        api: [{ tenant: 'demo', secrets: { PUBLIC_URL: 'url4' } }]
      });
    });

    it('should log summary with correct counts', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/t1/apps/web',
          secrets: [
            {
              secretKey: 'SECRET',
              secretValue: 'val',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/t2/apps/web',
          secrets: [
            {
              secretKey: 'SECRET',
              secretValue: 'val',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/t1/apps/api',
          secrets: [
            {
              secretKey: 'SECRET',
              secretValue: 'val',
              secretMetadata: []
            }
          ]
        }
      ]);

      await fetchAppTenants(defaultConfig, ['web', 'api', 'cms']);

      expect(core.info).toHaveBeenCalledWith(
        '[fetch-app-tenants] Total: 2 multi-tenant app(s), 3 tenant deployment(s)'
      );
      expect(core.info).toHaveBeenCalledWith('  - web: 2 tenant(s) [t1, t2]');
      expect(core.info).toHaveBeenCalledWith('  - api: 1 tenant(s) [t1]');
      expect(core.info).toHaveBeenCalledWith(
        '  - cms: single-tenant (no multi-tenancy)'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle real-world scenario with multiple tenant apps', async () => {
      mockWithInfisical.mockResolvedValue([
        {
          path: '/tenants/demo/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://demo.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/acme/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://acme.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/globex/apps/web',
          secrets: [
            {
              secretKey: 'PUBLIC_URL',
              secretValue: 'https://globex.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/demo/apps/api',
          secrets: [
            {
              secretKey: 'API_URL',
              secretValue: 'https://demo-api.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/acme/apps/api',
          secrets: [
            {
              secretKey: 'API_URL',
              secretValue: 'https://acme-api.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/globex/apps/api',
          secrets: [
            {
              secretKey: 'API_URL',
              secretValue: 'https://globex-api.example.com',
              secretMetadata: []
            }
          ]
        },
        {
          path: '/tenants/internal/apps/admin',
          secrets: [
            {
              secretKey: 'ADMIN_SECRET',
              secretValue: 'secret',
              secretMetadata: []
            }
          ]
        }
      ]);

      const result = await fetchAppTenants(defaultConfig, [
        'web',
        'api',
        'cms',
        'admin'
      ]);

      expect(result).toEqual({
        web: [
          {
            tenant: 'acme',
            secrets: { PUBLIC_URL: 'https://acme.example.com' }
          },
          {
            tenant: 'demo',
            secrets: { PUBLIC_URL: 'https://demo.example.com' }
          },
          {
            tenant: 'globex',
            secrets: { PUBLIC_URL: 'https://globex.example.com' }
          }
        ],
        api: [
          {
            tenant: 'acme',
            secrets: { API_URL: 'https://acme-api.example.com' }
          },
          {
            tenant: 'demo',
            secrets: { API_URL: 'https://demo-api.example.com' }
          },
          {
            tenant: 'globex',
            secrets: { API_URL: 'https://globex-api.example.com' }
          }
        ],
        cms: [],
        admin: [{ tenant: 'internal', secrets: { ADMIN_SECRET: 'secret' } }]
      });
    });
  });
});
