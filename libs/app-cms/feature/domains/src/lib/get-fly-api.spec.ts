import { FlyApi } from '@cdwr/fly-node/api';
import { getIntegrationCredentials } from '@codeware/shared/feature/infisical';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getFlyApi } from './get-fly-api';

vi.mock('@codeware/shared/feature/infisical');

const credentials = vi.mocked(getIntegrationCredentials);

describe('getFlyApi', () => {
  beforeEach(() => {
    credentials.mockReset();
    credentials.mockResolvedValue({ API_TOKEN: 'fly_token' });
  });

  afterEach(() => {
    delete process.env['DEPLOY_ENV'];
  });

  it('builds a client from the stored token', async () => {
    await expect(getFlyApi()).resolves.toBeInstanceOf(FlyApi);
    expect(credentials).toHaveBeenCalledWith('fly', expect.anything());
  });

  it('reads from the environment the deployment runs in', async () => {
    process.env['DEPLOY_ENV'] = 'production';

    await getFlyApi();

    expect(credentials).toHaveBeenCalledWith('fly', {
      environment: 'production'
    });
  });

  it('answers null when the integration is not configured', async () => {
    // Custom domains are optional: the panel should explain this, not crash
    credentials.mockResolvedValue({});

    await expect(getFlyApi()).resolves.toBeNull();
  });

  it('answers null when the folder exists without a token', async () => {
    credentials.mockResolvedValue({ ORG: 'codeware' });

    await expect(getFlyApi()).resolves.toBeNull();
  });

  it('propagates a broken secret store rather than disabling the feature', async () => {
    // Silently reporting "not configured" here would invite someone to add a
    // token that is already there
    credentials.mockRejectedValue(new Error('Could not resolve credentials'));

    await expect(getFlyApi()).rejects.toThrow('Could not resolve credentials');
  });
});
