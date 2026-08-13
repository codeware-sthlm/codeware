import { withInfisical } from '@codeware/shared/feature/infisical';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findDomainSecrets } from './find-domain-secrets';

vi.mock('@codeware/shared/feature/infisical');

const read = vi.mocked(withInfisical);

const secret = (secretKey: string, secretValue: string) =>
  ({ secretKey, secretValue, secretMetadata: [], version: 1 }) as never;

const folder = (path: string, secrets: Array<unknown>) => ({ path, secrets });

/** Answer the plain read with one set of folders and the cors-tagged read with another */
const respond = (all: unknown, tagged: unknown) => {
  read.mockImplementation((options) =>
    Promise.resolve(
      (options?.filter?.tags?.includes('cors') ? tagged : all) as never
    )
  );
};

const host = 'tours.example.com';

describe('findDomainSecrets', () => {
  beforeEach(() => read.mockReset());
  afterEach(() => delete process.env['DEPLOY_ENV']);

  it('finds the secret that points at the domain', async () => {
    respond(
      [
        folder('/tenants/moon/apps/web', [
          secret('CUSTOM_URL', 'https://tours.example.com'),
          secret('PAYLOAD_API_KEY', 'secret')
        ])
      ],
      []
    );

    const report = await findDomainSecrets(host);

    expect(report.secrets).toEqual([
      { path: '/tenants/moon/apps/web', key: 'CUSTOM_URL', isCorsTagged: false }
    ]);
  });

  it('reports whether the cms will accept the domain as an origin', async () => {
    const folders = [
      folder('/tenants/moon/apps/web', [
        secret('CUSTOM_URL', 'https://tours.example.com')
      ])
    ];
    respond(folders, folders);

    const report = await findDomainSecrets(host);

    expect(report.hasCors).toBe(true);
    expect(report.secrets[0].isCorsTagged).toBe(true);
  });

  it('separates an untagged secret from a tagged one in the same folder', async () => {
    respond(
      [
        folder('/tenants/moon/apps/web', [
          secret('CUSTOM_URL', 'https://tours.example.com'),
          secret('PUBLIC_URL', 'https://tours.example.com')
        ])
      ],
      [
        folder('/tenants/moon/apps/web', [
          secret('PUBLIC_URL', 'https://tours.example.com')
        ])
      ]
    );

    const report = await findDomainSecrets(host);

    expect(report.secrets).toEqual([
      {
        path: '/tenants/moon/apps/web',
        key: 'CUSTOM_URL',
        isCorsTagged: false
      },
      { path: '/tenants/moon/apps/web', key: 'PUBLIC_URL', isCorsTagged: true }
    ]);
  });

  it('surfaces a domain wired up under the wrong workspace', async () => {
    // Searching by value rather than by path is what makes this visible
    respond(
      [
        folder('/tenants/titan/apps/web', [
          secret('CUSTOM_URL', 'https://tours.example.com')
        ])
      ],
      []
    );

    const report = await findDomainSecrets(host);

    expect(report.secrets[0].path).toBe('/tenants/titan/apps/web');
  });

  it('reports nothing found when no secret mentions the domain', async () => {
    respond(
      [
        folder('/tenants/moon/apps/web', [
          secret('CUSTOM_URL', 'https://other.example.com')
        ])
      ],
      []
    );

    await expect(findDomainSecrets(host)).resolves.toEqual({
      secrets: [],
      hasCors: false,
      unavailable: false
    });
  });

  it('says so when Infisical could not be read', async () => {
    // "None found" and "could not look" must not read the same, or a broken
    // secret store looks like missing configuration
    respond(null, null);

    await expect(findDomainSecrets(host)).resolves.toMatchObject({
      unavailable: true
    });
  });

  it('reads the environment the deployment runs in', async () => {
    process.env['DEPLOY_ENV'] = 'production';
    respond([], []);

    await findDomainSecrets(host);

    expect(read).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'production' })
    );
  });

  it('walks every workspace folder in one pass', async () => {
    respond([], []);

    await findDomainSecrets(host);

    expect(read).toHaveBeenCalledTimes(2);
    expect(read).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ path: '/tenants' }),
        groupByFolder: true
      })
    );
  });
});
