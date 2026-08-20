import { describe, expect, it } from 'vitest';

import {
  type DomainStatusItem,
  byWorstFirst,
  summarizeDomains
} from './domain-status-row';

const now = new Date('2026-08-20T00:00:00.000Z');

const inDays = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

const domain = (
  overrides: Partial<DomainStatusItem> = {}
): DomainStatusItem => ({
  hostname: 'demo.codeware.se',
  app: 'cdwr-cms-demo',
  status: 'active',
  hasIssues: false,
  href: '#',
  owner: 'Demo',
  ...overrides
});

describe('summarizeDomains', () => {
  it('is green when every domain has a clean active certificate', () => {
    expect(
      summarizeDomains([domain(), domain({ hostname: 'b.se' })], now)
    ).toEqual({ tone: 'ok', kind: 'all-active', count: 2 });
  });

  it('says nothing at all when no domains are configured', () => {
    expect(summarizeDomains([], now)).toEqual({
      tone: 'neutral',
      kind: 'none',
      count: 0
    });
  });

  it('ranks a rate limit above an active certificate with issues', () => {
    expect(
      summarizeDomains(
        [domain({ hasIssues: true }), domain({ status: 'paused' })],
        now
      )
    ).toEqual({ tone: 'error', kind: 'paused', count: 1 });
  });

  it('counts only the domains in the worst state, not the total', () => {
    expect(
      summarizeDomains(
        [
          domain({ hostname: 'a.se', status: 'pending' }),
          domain({ hostname: 'b.se', status: 'pending' }),
          domain({ hostname: 'c.se' })
        ],
        now
      )
    ).toEqual({ tone: 'warning', kind: 'pending', count: 2 });
  });

  it('reports an expiring certificate ahead of a merely pending one', () => {
    expect(
      summarizeDomains(
        [
          domain({ hostname: 'a.se', status: 'pending' }),
          domain({ hostname: 'b.se', expiresAt: inDays(3) })
        ],
        now
      )
    ).toEqual({ tone: 'warning', kind: 'expiring', count: 1 });
  });
});

describe('byWorstFirst', () => {
  /**
   * The sheet exists to explain the widget, so the row it opens on has to be
   * the state the widget is quoting. These two orderings drifting apart is
   * exactly the defect this sort shares a table with `summarizeDomains` to
   * prevent.
   */
  it('opens on the state the widget reports', () => {
    const items = [
      domain({ hostname: 'pending.se', status: 'pending' }),
      domain({ hostname: 'issues.se', hasIssues: true }),
      domain({ hostname: 'paused.se', status: 'paused' }),
      domain({ hostname: 'none.se', status: 'not-requested' }),
      domain({ hostname: 'healthy.se' })
    ];

    const verdict = summarizeDomains(items, new Date());
    const first = [...items].sort(byWorstFirst).at(0);

    expect(verdict.kind).toBe('paused');
    expect(first?.hostname).toBe('paused.se');
  });

  it('orders every state by how much it costs to ignore', () => {
    const items = [
      domain({ hostname: 'healthy.se' }),
      domain({ hostname: 'pending.se', status: 'pending' }),
      domain({ hostname: 'none.se', status: 'not-requested' }),
      domain({ hostname: 'issues.se', hasIssues: true }),
      domain({ hostname: 'paused.se', status: 'paused' })
    ];

    expect([...items].sort(byWorstFirst).map((item) => item.hostname)).toEqual([
      'paused.se',
      'issues.se',
      'none.se',
      'pending.se',
      'healthy.se'
    ]);
  });

  it('falls back to the hostname so the order is stable', () => {
    const items = [
      domain({ hostname: 'b.se', status: 'pending' }),
      domain({ hostname: 'a.se', status: 'pending' })
    ];

    expect([...items].sort(byWorstFirst).map((item) => item.hostname)).toEqual([
      'a.se',
      'b.se'
    ]);
  });
});
