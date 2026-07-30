import * as infisicalModule from '@codeware/shared/feature/infisical';

import { fetchAppSentry } from './fetch-app-sentry';
import type { InfisicalConfig } from './infisical-config';

vi.mock('@actions/core');
vi.mock('@codeware/shared/feature/infisical');

type FolderSecret = Partial<infisicalModule.FolderSecrets['secrets'][number]>;

describe('fetchAppSentry', () => {
  let mockWithInfisical: ReturnType<typeof vi.fn>;

  const defaultConfig: InfisicalConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    environment: 'production',
    projectId: 'test-project-id',
    site: 'eu'
  };

  const folder = (path: string, secrets: Record<string, string>) => ({
    path,
    secrets: Object.entries(secrets).map(
      ([secretKey, secretValue]): FolderSecret => ({
        secretKey,
        secretValue,
        secretMetadata: []
      })
    )
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockWithInfisical = vi.fn().mockResolvedValue([]);

    vi.mocked(infisicalModule.withInfisical).mockImplementation(
      mockWithInfisical as never
    );
  });

  it('should return empty map when no apps provided', async () => {
    const result = await fetchAppSentry(defaultConfig, []);

    expect(result).toEqual({});
    expect(mockWithInfisical).not.toHaveBeenCalled();
  });

  it('should read the app folders shallow', async () => {
    await fetchAppSentry(defaultConfig, ['web']);

    expect(mockWithInfisical).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { path: '/apps', recurse: false },
        groupByFolder: true
      })
    );
  });

  it('should map each app to its own project and dsn', async () => {
    mockWithInfisical.mockResolvedValue([
      folder('/apps/cms', {
        SENTRY_PROJECT: 'cms',
        SENTRY_DSN: 'https://cms@sentry.io/1'
      }),
      folder('/apps/web', {
        SENTRY_PROJECT: 'web',
        SENTRY_DSN: 'https://web@sentry.io/2'
      })
    ]);

    const result = await fetchAppSentry(defaultConfig, ['cms', 'web']);

    expect(result).toEqual({
      cms: { project: 'cms', dsn: 'https://cms@sentry.io/1' },
      web: { project: 'web', dsn: 'https://web@sentry.io/2' }
    });
  });

  it('should ignore apps that are not being deployed', async () => {
    mockWithInfisical.mockResolvedValue([
      folder('/apps/cms', {
        SENTRY_PROJECT: 'cms',
        SENTRY_DSN: 'https://cms@sentry.io/1'
      }),
      folder('/apps/web', {
        SENTRY_PROJECT: 'web',
        SENTRY_DSN: 'https://web@sentry.io/2'
      })
    ]);

    const result = await fetchAppSentry(defaultConfig, ['web']);

    expect(result).toEqual({
      web: { project: 'web', dsn: 'https://web@sentry.io/2' }
    });
  });

  it('should omit an app with an incomplete configuration', async () => {
    mockWithInfisical.mockResolvedValue([
      folder('/apps/web', { SENTRY_PROJECT: 'web' })
    ]);

    const result = await fetchAppSentry(defaultConfig, ['web']);

    expect(result).toEqual({});
  });

  it('should ignore nested folders', async () => {
    mockWithInfisical.mockResolvedValue([
      folder('/apps/web/legacy', {
        SENTRY_PROJECT: 'legacy',
        SENTRY_DSN: 'https://legacy@sentry.io/3'
      })
    ]);

    const result = await fetchAppSentry(defaultConfig, ['web']);

    expect(result).toEqual({});
  });

  it('should propagate a fetch error', async () => {
    mockWithInfisical.mockRejectedValue(new Error('Connection failed'));

    await expect(fetchAppSentry(defaultConfig, ['web'])).rejects.toThrow(
      'Connection failed'
    );
  });
});
