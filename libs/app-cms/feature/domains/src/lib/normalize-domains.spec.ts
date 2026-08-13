import { describe, expect, it } from 'vitest';

import { normalizeDomains } from './normalize-domains';
import type { TenantWithDomains } from './tenant-domain';

/** What a hook is handed: the incoming data, which is partial by definition */
type Data = Partial<TenantWithDomains>;

const run = (data: Data) =>
  // The hook reads only `data`; the rest of the Payload argument is irrelevant
  (normalizeDomains as unknown as (args: { data: Data }) => Data)({ data });

describe('normalizeDomains', () => {
  it('lowercases and trims every hostname', () => {
    const result = run({
      domains: [{ hostname: '  Tours.Example.COM ', app: 'cdwr-web-moon' }]
    });

    expect(result.domains).toEqual([
      { hostname: 'tours.example.com', app: 'cdwr-web-moon' }
    ]);
  });

  it('drops a trailing dot so one domain cannot be stored twice', () => {
    const result = run({
      domains: [
        { hostname: 'tours.example.com.', app: 'web' },
        { hostname: 'tours.example.com', app: 'web' }
      ]
    });

    expect(result.domains?.map((d) => d.hostname)).toEqual([
      'tours.example.com',
      'tours.example.com'
    ]);
  });

  it('keeps the other fields on the row', () => {
    const result = run({
      domains: [{ hostname: 'EXAMPLE.com', app: 'web', isPrimary: true }]
    });

    expect(result.domains?.[0]).toEqual({
      hostname: 'example.com',
      app: 'web',
      isPrimary: true
    });
  });

  it('leaves an unparseable hostname for the field validation to explain', () => {
    // Rewriting it here would change what the person typed under an error
    // message that then no longer matches
    const result = run({
      domains: [{ hostname: 'https://tours.example.com', app: 'web' }]
    });

    expect(result.domains?.[0].hostname).toBe('https://tours.example.com');
  });

  it('passes through a tenant with no domains', () => {
    expect(run({ name: 'Moon' })).toEqual({ name: 'Moon' });
    expect(run({ name: 'Moon', domains: [] })).toEqual({
      name: 'Moon',
      domains: []
    });
  });
});
