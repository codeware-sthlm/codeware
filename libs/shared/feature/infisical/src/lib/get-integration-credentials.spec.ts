import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearIntegrationCredentials,
  getIntegrationCredentials
} from './get-integration-credentials';
import { withInfisical } from './with-infisical';

vi.mock('./with-infisical');

const secret = (secretKey: string, secretValue: string) => ({
  secretKey,
  secretValue,
  secretMetadata: [],
  version: 1
});

/** How Infisical reports a folder that does not exist */
const notFound = () =>
  new Error('Failed to fetch secrets [StatusCode=404] [Message=Not Found]');

const read = vi.mocked(withInfisical);

describe('getIntegrationCredentials', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearIntegrationCredentials();
    read.mockReset();
    read.mockResolvedValue([secret('API_TOKEN', 'fly_token')] as never);
    process.env['INFISICAL_PROJECT_ID'] = 'project-1';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env['INFISICAL_PROJECT_ID'];
  });

  it('reads the provider folder and keys the secrets by name', async () => {
    read.mockResolvedValue([
      secret('API_TOKEN', 'fly_token'),
      secret('ORG', 'codeware')
    ] as never);

    await expect(getIntegrationCredentials('fly')).resolves.toEqual({
      API_TOKEN: 'fly_token',
      ORG: 'codeware'
    });
    expect(read).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { path: '/integrations/fly', recurse: false }
      })
    );
  });

  it('serves a cached set rather than authenticating again', async () => {
    await getIntegrationCredentials('fly');
    await getIntegrationCredentials('fly');

    expect(read).toHaveBeenCalledTimes(1);
  });

  it('reads again once the cached set has expired', async () => {
    await getIntegrationCredentials('fly', { ttlMs: 1000 });
    vi.advanceTimersByTime(1001);
    await getIntegrationCredentials('fly', { ttlMs: 1000 });

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('never caches when the caller asks for a fresh read', async () => {
    await getIntegrationCredentials('fly', { ttlMs: 0 });
    await getIntegrationCredentials('fly', { ttlMs: 0 });

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('answers emptily for a provider nobody has configured', async () => {
    // The folder is simply absent until someone adds the integration, which is
    // an answer - a panel offering to configure it must still render
    read.mockRejectedValue(notFound());

    await expect(getIntegrationCredentials('fly')).resolves.toEqual({});
  });

  it('caches the empty answer too', async () => {
    read.mockRejectedValue(notFound());

    await getIntegrationCredentials('fly');
    await getIntegrationCredentials('fly');

    expect(read).toHaveBeenCalledTimes(1);
  });

  it('propagates a failure that is not a missing folder', async () => {
    read.mockRejectedValue(
      new Error('Could not resolve Infisical credentials')
    );

    await expect(getIntegrationCredentials('fly')).rejects.toThrow(
      'Could not resolve Infisical credentials'
    );
  });

  it('re-reads a provider after its credentials are cleared', async () => {
    await getIntegrationCredentials('fly');
    clearIntegrationCredentials('fly');
    await getIntegrationCredentials('fly');

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('leaves other providers cached when one is cleared', async () => {
    await getIntegrationCredentials('fly');
    await getIntegrationCredentials('cloudflare');
    clearIntegrationCredentials('fly');
    await getIntegrationCredentials('cloudflare');

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('does not serve one environment from another environment cache', async () => {
    // Staging and production hold different tokens under the same path
    await getIntegrationCredentials('fly', { environment: 'production' });
    await getIntegrationCredentials('fly', { environment: 'staging' });

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('does not serve one project from another project cache', async () => {
    await getIntegrationCredentials('fly', { projectId: 'project-1' });
    await getIntegrationCredentials('fly', { projectId: 'project-2' });

    expect(read).toHaveBeenCalledTimes(2);
  });
});
