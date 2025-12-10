import { InfisicalSDK } from '@infisical/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { withInfisical } from './with-infisical';

vi.mock('@infisical/sdk');

// Type-safe mock for InfisicalSDK instance
type MockInfisicalClient = {
  auth: () => {
    accessToken: ReturnType<typeof vi.fn>;
    universalAuth: {
      login: ReturnType<typeof vi.fn>;
    };
  };
  secrets: () => {
    listSecretsWithImports: ReturnType<typeof vi.fn>;
  };
  folders: () => {
    listFolders: ReturnType<typeof vi.fn>;
  };
};

describe('withInfisical', () => {
  const mockSecrets = [
    { secretKey: 'API_KEY', secretValue: 'test-key', version: 1 },
    { secretKey: 'DATABASE_URL', secretValue: 'postgres://test', version: 1 }
  ];

  let mockClient: MockInfisicalClient;
  let originalEnv: NodeJS.ProcessEnv;

  console.log = vi.fn();

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockClient = {
      auth: vi.fn().mockReturnValue({
        accessToken: vi.fn(),
        universalAuth: {
          login: vi.fn().mockResolvedValue({})
        }
      }),
      secrets: vi.fn().mockReturnValue({
        listSecretsWithImports: vi.fn().mockResolvedValue(mockSecrets)
      }),
      folders: vi.fn().mockReturnValue({
        listFolders: vi.fn().mockResolvedValue([])
      })
    };

    vi.mocked(InfisicalSDK).mockImplementation(
      () => mockClient as unknown as InfisicalSDK
    );

    // Set required environment variables
    process.env['INFISICAL_CLIENT_ID'] = 'test-client-id';
    process.env['INFISICAL_CLIENT_SECRET'] = 'test-client-secret';
    process.env['INFISICAL_PROJECT_ID'] = 'test-project-id';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate with universal auth when CLIENT_ID and CLIENT_SECRET are provided', async () => {
      await withInfisical();

      expect(mockClient.auth().universalAuth.login).toHaveBeenCalledWith({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });
    });

    it('should authenticate with service token when INFISICAL_SERVICE_TOKEN is provided', async () => {
      delete process.env['INFISICAL_CLIENT_ID'];
      delete process.env['INFISICAL_CLIENT_SECRET'];
      process.env['INFISICAL_SERVICE_TOKEN'] = 'test-service-token';

      await withInfisical();

      expect(mockClient.auth().accessToken).toHaveBeenCalledWith(
        'test-service-token'
      );
    });

    it('should use EU site when site option is "eu"', async () => {
      await withInfisical({ site: 'eu' });

      expect(InfisicalSDK).toHaveBeenCalledWith({
        siteUrl: 'https://eu.infisical.com'
      });
    });

    it('should use US site by default', async () => {
      await withInfisical();

      expect(InfisicalSDK).toHaveBeenCalledWith({
        siteUrl: undefined
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when credentials are missing', async () => {
      delete process.env['INFISICAL_CLIENT_ID'];
      delete process.env['INFISICAL_CLIENT_SECRET'];
      delete process.env['INFISICAL_PROJECT_ID'];
      delete process.env['INFISICAL_SERVICE_TOKEN'];

      await expect(withInfisical()).rejects.toThrow(
        'Could not resolve Infisical credentials'
      );
    });

    it('should return null when credentials are missing and silent mode is enabled', async () => {
      delete process.env['INFISICAL_CLIENT_ID'];
      delete process.env['INFISICAL_CLIENT_SECRET'];
      delete process.env['INFISICAL_PROJECT_ID'];

      const result = await withInfisical({ silent: true });

      expect(result).toBeNull();
    });

    it('should throw error when API call fails', async () => {
      mockClient
        .secrets()
        .listSecretsWithImports.mockRejectedValue(new Error('API Error'));

      await expect(withInfisical()).rejects.toThrow('API Error');
    });

    it('should return null when API call fails and silent mode is enabled', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {
          // Mock implementation
        });
      mockClient
        .secrets()
        .listSecretsWithImports.mockRejectedValue(new Error('API Error'));

      const result = await withInfisical({ silent: true });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('API Error');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Secrets Fetching', () => {
    it('should fetch secrets with default options', async () => {
      const result = await withInfisical();

      expect(mockClient.secrets().listSecretsWithImports).toHaveBeenCalledWith({
        environment: 'development',
        projectId: 'test-project-id',
        attachToProcessEnv: false,
        expandSecretReferences: true,
        recursive: false,
        secretPath: undefined,
        tagSlugs: undefined
      });
      expect(result).toEqual(mockSecrets);
    });

    it('should use custom environment', async () => {
      await withInfisical({ environment: 'production' });

      expect(mockClient.secrets().listSecretsWithImports).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'production'
        })
      );
    });

    it('should apply filter options', async () => {
      await withInfisical({
        filter: {
          path: '/app/config',
          recurse: true,
          tags: ['backend', 'api']
        }
      });

      expect(mockClient.secrets().listSecretsWithImports).toHaveBeenCalledWith(
        expect.objectContaining({
          secretPath: '/app/config',
          recursive: true,
          tagSlugs: ['backend', 'api']
        })
      );
    });

    it('should inject secrets into process.env when injectEnv is true', async () => {
      await withInfisical({ injectEnv: true });

      expect(mockClient.secrets().listSecretsWithImports).toHaveBeenCalledWith(
        expect.objectContaining({
          attachToProcessEnv: true
        })
      );
    });
  });

  describe('Folder Grouping', () => {
    beforeEach(() => {
      const mockFolders = [
        { name: 'app', recursivePath: 'app' },
        { name: 'config', recursivePath: 'app/config' }
      ];

      mockClient.folders().listFolders.mockResolvedValue(mockFolders);

      const mockAppSecrets = [
        { secretKey: 'APP_NAME', secretValue: 'MyApp', version: 1 }
      ];
      const mockConfigSecrets = [
        { secretKey: 'PORT', secretValue: '3000', version: 1 }
      ];

      mockClient
        .secrets()
        .listSecretsWithImports.mockResolvedValueOnce(mockAppSecrets)
        .mockResolvedValueOnce(mockConfigSecrets);
    });

    it('should group secrets by folder when groupByFolder is true', async () => {
      const result = await withInfisical({ groupByFolder: true });

      expect(mockClient.folders().listFolders).toHaveBeenCalledWith({
        environment: 'development',
        projectId: 'test-project-id',
        path: undefined,
        recursive: true
      });

      expect(result).toEqual([
        {
          path: expect.stringContaining('app'),
          secrets: expect.any(Array)
        },
        {
          path: expect.stringContaining('config'),
          secrets: expect.any(Array)
        }
      ]);
    });

    it('should handle folder recursivePath correctly', async () => {
      await withInfisical({ groupByFolder: true });

      // Should call listSecretsWithImports for each folder
      expect(mockClient.secrets().listSecretsWithImports).toHaveBeenCalledTimes(
        2
      );
    });

    it('should apply path filter when grouping by folder', async () => {
      await withInfisical({
        groupByFolder: true,
        filter: { path: '/tenant1' }
      });

      expect(mockClient.folders().listFolders).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/tenant1'
        })
      );
    });
  });

  describe('Hooks', () => {
    it('should call onConnect hook with client instance', async () => {
      const onConnect = vi.fn();

      await withInfisical({ onConnect });

      expect(onConnect).toHaveBeenCalledWith(mockClient);
    });
  });

  describe('Type Safety', () => {
    it('should return correct type for flat secrets', async () => {
      const result = await withInfisical();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('secretKey');
    });

    it('should return correct type for grouped secrets', async () => {
      mockClient
        .folders()
        .listFolders.mockResolvedValue([
          { name: 'test', recursivePath: 'test' }
        ]);
      mockClient.secrets().listSecretsWithImports.mockResolvedValue([]);

      const result = await withInfisical({ groupByFolder: true });
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('path');
        expect(result[0]).toHaveProperty('secrets');
      }
    });
  });
});
