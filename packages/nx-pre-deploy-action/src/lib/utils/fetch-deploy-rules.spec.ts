import * as infisical from '@codeware/shared/feature/infisical';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InfisicalConfig } from '../schemas/config.schema';

import { fetchDeployRules } from './fetch-deploy-rules';

vi.mock('@codeware/shared/feature/infisical');

describe('fetchDeployRules', () => {
  const mockConfig: InfisicalConfig = {
    environment: 'development',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    projectId: 'test-project-id',
    site: 'eu'
  };

  const mockWithInfisical = vi.mocked<
    typeof infisical.withInfisical<'development'>
  >(infisical.withInfisical);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setMockResponse = (
    secret: Pick<
      infisical.Secret,
      'secretKey' | 'secretValue' | 'secretMetadata'
    >
  ) => {
    const baseSecret = (<Partial<infisical.Secret>>{
      environment: 'development',
      secretPath: '/',
      version: 1,
      workspace: 'workspace-id'
    }) as infisical.Secret;

    mockWithInfisical.mockResolvedValue([
      {
        ...baseSecret,
        ...secret
      }
    ]);
  };

  describe('successful scenarios', () => {
    it('should parse rules from secret metadata', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: 'ignored',
        secretMetadata: [{ apps: 'web,cms' }, { tenants: 'demo' }]
      });

      const result = await fetchDeployRules(mockConfig);

      expect(result).toEqual({
        apps: 'web,cms',
        tenants: 'demo'
      });
    });

    it('should handle single metadata object', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: 'ignored',
        secretMetadata: [{ apps: '*', tenants: 'demo' }]
      });

      const result = await fetchDeployRules(mockConfig);

      expect(result).toEqual({
        apps: '*',
        tenants: 'demo'
      });
    });

    it('should fallback to parsing secret value as JSON', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: JSON.stringify({ apps: 'web', tenants: '*' }),
        secretMetadata: []
      });

      const result = await fetchDeployRules(mockConfig);

      expect(result).toEqual({
        apps: 'web',
        tenants: '*'
      });
    });
  });

  describe('error scenarios', () => {
    it('should throw error when no secrets found', async () => {
      mockWithInfisical.mockResolvedValue([]);

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'No secrets found in root path. DEPLOY_RULES is required for deployment.'
      );
    });

    it('should throw error when DEPLOY_RULES secret not found', async () => {
      setMockResponse({
        secretKey: 'OTHER_SECRET',
        secretValue: 'value',
        secretMetadata: []
      });

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'DEPLOY_RULES secret not found in root path'
      );
    });

    it('should throw error when secret value is invalid JSON', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: 'not-json',
        secretMetadata: []
      });

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'DEPLOY_RULES format is invalid'
      );
    });

    it('should throw error when withInfisical returns null', async () => {
      mockWithInfisical.mockResolvedValue(null as never);

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'No secrets found in root path. DEPLOY_RULES is required for deployment.'
      );
    });

    it('should throw error when withInfisical throws error', async () => {
      mockWithInfisical.mockRejectedValue(new Error('Connection failed'));

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'Failed to fetch DEPLOY_RULES: Connection failed'
      );
    });

    it('should throw error when metadata is empty', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: 'ignored',
        secretMetadata: []
      });

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'DEPLOY_RULES format is invalid'
      );
    });

    it('should throw error when metadata has only apps', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: 'ignored',
        secretMetadata: [{ apps: 'web' }]
      });

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'DEPLOY_RULES format is invalid'
      );
    });

    it('should throw error when metadata has only tenants', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: 'ignored',
        secretMetadata: [{ tenants: 'demo' }]
      });

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'DEPLOY_RULES format is invalid'
      );
    });

    it('should throw error when JSON apps field is missing', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: JSON.stringify({ tenants: '*' }),
        secretMetadata: []
      });

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'DEPLOY_RULES format is invalid'
      );
    });

    it('should throw error when JSON tenants field is missing', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: JSON.stringify({ apps: '*' }),
        secretMetadata: []
      });

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'DEPLOY_RULES format is invalid'
      );
    });
  });

  describe('edge cases', () => {
    it('should throw error on invalid schema types', async () => {
      setMockResponse({
        secretKey: 'DEPLOY_RULES',
        secretValue: JSON.stringify({ apps: 123, tenants: true }),
        secretMetadata: []
      });

      await expect(fetchDeployRules(mockConfig)).rejects.toThrow(
        'DEPLOY_RULES format is invalid'
      );
    });
  });
});
