import { beforeEach, describe, expect, it, vi } from 'vitest';

import { guardDomainConflicts } from './guard-domain-conflicts';
import type { TenantWithDomains } from './tenant-domain';

type HookArgs = Parameters<typeof guardDomainConflicts>[0];

/** Tenants the cross-tenant lookup finds */
let claimed: Array<TenantWithDomains> = [];

const find = vi.fn(async () => ({ docs: claimed }));

const req = () =>
  ({
    payload: { find },
    // The translated message is asserted through its key, not its wording
    t: (key: string) => key
  }) as unknown as HookArgs['req'];

const invoke = (
  data: Partial<TenantWithDomains>,
  originalDoc?: Partial<TenantWithDomains>
): Promise<unknown> =>
  guardDomainConflicts({
    data,
    originalDoc,
    req: req()
  } as unknown as HookArgs) as Promise<unknown>;

const moon = { id: 1, name: 'Moon' };

describe('guardDomainConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    claimed = [];
  });

  it('accepts distinct domains', async () => {
    await expect(
      invoke({
        ...moon,
        domains: [
          { hostname: 'tours.example.com', app: 'cdwr-web-moon' },
          { hostname: 'example.com', app: 'cdwr-web-moon' }
        ]
      })
    ).resolves.toBeDefined();
  });

  it('refuses the same hostname listed twice', async () => {
    await expect(
      invoke({
        ...moon,
        domains: [
          { hostname: 'tours.example.com', app: 'cdwr-web-moon' },
          { hostname: 'tours.example.com', app: 'cdwr-cms-moon' }
        ]
      })
    ).rejects.toThrow('validation:domainDuplicate');
  });

  it('refuses two primaries for one app', async () => {
    await expect(
      invoke({
        ...moon,
        domains: [
          { hostname: 'a.example.com', app: 'cdwr-web-moon', isPrimary: true },
          { hostname: 'b.example.com', app: 'cdwr-web-moon', isPrimary: true }
        ]
      })
    ).rejects.toThrow('validation:domainOnePrimary');
  });

  it('allows one primary per app across different apps', async () => {
    await expect(
      invoke({
        ...moon,
        domains: [
          { hostname: 'a.example.com', app: 'cdwr-web-moon', isPrimary: true },
          { hostname: 'b.example.com', app: 'cdwr-cms-moon', isPrimary: true }
        ]
      })
    ).resolves.toBeDefined();
  });

  it('refuses a hostname another workspace already claims', async () => {
    claimed = [
      { id: 2, name: 'Titan', domains: [{ hostname: 'tours.example.com' }] }
    ];

    await expect(
      invoke({
        ...moon,
        domains: [{ hostname: 'tours.example.com', app: 'cdwr-web-moon' }]
      })
    ).rejects.toThrow('validation:domainTaken');
  });

  it('does not treat a tenant own stored rows as a conflict', async () => {
    // Every update matches itself, which would make a domain unsavable twice
    claimed = [
      { id: 1, name: 'Moon', domains: [{ hostname: 'tours.example.com' }] }
    ];

    await expect(
      invoke(
        {
          ...moon,
          domains: [{ hostname: 'tours.example.com', app: 'cdwr-web-moon' }]
        },
        moon
      )
    ).resolves.toBeDefined();
  });

  it('compares ids across the string and number forms payload uses', async () => {
    claimed = [
      { id: '1', name: 'Moon', domains: [{ hostname: 'tours.example.com' }] }
    ];

    await expect(
      invoke(
        { domains: [{ hostname: 'tours.example.com', app: 'cdwr-web-moon' }] },
        { id: 1, name: 'Moon' }
      )
    ).resolves.toBeDefined();
  });

  it('asks for every hostname in one query', async () => {
    await invoke({
      ...moon,
      domains: [
        { hostname: 'a.example.com', app: 'web' },
        { hostname: 'b.example.com', app: 'web' }
      ]
    });

    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          'domains.hostname': { in: ['a.example.com', 'b.example.com'] }
        }
      })
    );
  });

  it('ignores a half-filled row rather than claiming a nameless domain', async () => {
    // The admin adds an empty row the moment you click "Add"
    await invoke({ ...moon, domains: [{ hostname: '', app: '' }] });

    expect(find).not.toHaveBeenCalled();
  });

  it('reads other workspaces regardless of who is saving', async () => {
    // A conflicting domain must be found even when the reader cannot see that
    // workspace, or the check would pass for exactly the people it guards
    await invoke({
      ...moon,
      domains: [{ hostname: 'a.example.com', app: 'web' }]
    });

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ overrideAccess: true })
    );
  });
});
