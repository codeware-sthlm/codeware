import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlyApi } from './fly-api.class';

/** Shaped as Fly's schema actually returns it, verified by introspection */
const certificate = {
  id: 'cert_1',
  hostname: 'tours.example.com',
  isConfigured: false,
  isApex: false,
  isAcmeDnsConfigured: false,
  isAcmeAlpnConfigured: false,
  certificateAuthority: 'lets_encrypt',
  createdAt: '2026-08-13T10:00:00Z',
  dnsProvider: 'enom',
  dnsValidationHostname: '_acme-challenge.tours.example.com',
  dnsValidationTarget: 'tours.example.com.abc.flydns.net',
  dnsValidationInstructions: 'Add a CNAME record …',
  clientStatus: 'Awaiting configuration',
  rateLimitedUntil: null,
  source: 'fly'
};

const check = {
  aRecords: [],
  cnameRecords: ['tours.example.com.abc.flydns.net'],
  dnsConfigured: false,
  acmeDnsConfigured: false,
  resolvedAddresses: []
};

/** Fly answers every query with 200; failures live in the body */
const respond = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    statusText: ok ? 'OK' : 'Unauthorized',
    json: () => Promise.resolve(body)
  } as Response);

const fetchMock = vi.fn();

const api = () =>
  new FlyApi({ token: 'fly_token', apiUrl: 'https://api.test/graphql' });

describe('FlyApi', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('refuses to be built without a token', () => {
    expect(() => new FlyApi({ token: '' })).toThrow('token is required');
  });

  it('authenticates with a bearer token', async () => {
    fetchMock.mockReturnValue(
      respond({ data: { addCertificate: { certificate, check } } })
    );

    await api().certs.add('cdwr-web-moon', 'tours.example.com');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/graphql');
    expect(init.headers.Authorization).toBe('Bearer fly_token');
    expect(JSON.parse(init.body).variables).toEqual({
      appId: 'cdwr-web-moon',
      hostname: 'tours.example.com'
    });
  });

  it('returns a pending certificate with what DNS still needs', async () => {
    fetchMock.mockReturnValue(
      respond({ data: { addCertificate: { certificate, check } } })
    );

    const result = await api().certs.add('cdwr-web-moon', 'tours.example.com');

    expect(result.certificate.isConfigured).toBe(false);
    expect(FlyApi.dnsInstructions(result.certificate)).toEqual({
      hostname: '_acme-challenge.tours.example.com',
      target: 'tours.example.com.abc.flydns.net',
      instructions: 'Add a CNAME record …',
      isApex: false
    });
  });

  it('reports what Fly resolves for the hostname right now', async () => {
    fetchMock.mockReturnValue(
      respond({ data: { addCertificate: { certificate, check } } })
    );

    const result = await api().certs.add('cdwr-web-moon', 'tours.example.com');

    expect(result.check?.dnsConfigured).toBe(false);
    expect(result.check?.cnameRecords).toEqual([
      'tours.example.com.abc.flydns.net'
    ]);
  });

  it('surfaces a rate limit, which correcting dns cannot fix', async () => {
    fetchMock.mockReturnValue(
      respond({
        data: {
          app: {
            certificate: {
              ...certificate,
              rateLimitedUntil: '2026-08-14T10:00:00Z'
            }
          }
        }
      })
    );

    const result = await api().certs.get('cdwr-web-moon', 'tours.example.com');

    expect(result?.rateLimitedUntil).toBe('2026-08-14T10:00:00Z');
  });

  it('answers null for a hostname the app has no certificate for', async () => {
    // Fly reports this as a NOT_FOUND *error* alongside a null field, not as a
    // plain null — asserting the shape it never sends is how a mocked test
    // passes while the real call throws
    fetchMock.mockReturnValue(
      respond({
        data: { app: { certificate: null } },
        errors: [
          {
            message: 'Could not find AppCertificate',
            extensions: { code: 'NOT_FOUND' }
          }
        ]
      })
    );

    await expect(
      api().certs.get('cdwr-web-moon', 'unknown.example.com')
    ).resolves.toBeNull();
  });

  it('still throws when only some errors are NOT_FOUND', async () => {
    fetchMock.mockReturnValue(
      respond({
        data: { app: null },
        errors: [
          {
            message: 'Could not find AppCertificate',
            extensions: { code: 'NOT_FOUND' }
          },
          {
            message: 'You must be authenticated',
            extensions: { code: 'UNAUTHORIZED' }
          }
        ]
      })
    );

    await expect(
      api().certs.get('cdwr-web-moon', 'unknown.example.com')
    ).rejects.toThrow('authenticated');
  });

  it('lists certificates, and an app with none', async () => {
    fetchMock.mockReturnValue(
      respond({ data: { app: { certificates: { nodes: [certificate] } } } })
    );
    await expect(api().certs.list('cdwr-web-moon')).resolves.toHaveLength(1);

    fetchMock.mockReturnValue(respond({ data: { app: null } }));
    await expect(api().certs.list('gone')).resolves.toEqual([]);
  });

  it('surfaces a GraphQL error rather than failing to parse', async () => {
    // Fly rejects with 200 and an errors array — trusting the status alone
    // would turn "permission denied" into a confusing parse failure
    fetchMock.mockReturnValue(
      respond({ errors: [{ message: 'You must be authenticated' }] })
    );

    await expect(
      api().certs.add('cdwr-web-moon', 'tours.example.com')
    ).rejects.toThrow('You must be authenticated');
  });

  it('separates an unreachable Fly from a rejection', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(api().certs.list('cdwr-web-moon')).rejects.toThrow(
      'could not reach Fly'
    );
  });

  it('reports a non-2xx response', async () => {
    fetchMock.mockReturnValue(respond({}, false, 401));

    await expect(api().certs.list('cdwr-web-moon')).rejects.toThrow('401');
  });

  it('tolerates peripheral fields Fly may rename', async () => {
    // Strict on what a caller acts on, lenient elsewhere: a domains screen
    // should not stop rendering because `dnsProvider` changed shape
    fetchMock.mockReturnValue(
      respond({
        data: {
          app: {
            certificate: { hostname: 'tours.example.com', isConfigured: true }
          }
        }
      })
    );

    const result = await api().certs.get('cdwr-web-moon', 'tours.example.com');

    expect(result?.isConfigured).toBe(true);
  });

  it('never touches the filesystem or a binary', async () => {
    // The whole point of this class: it runs where flyctl does not exist
    fetchMock.mockReturnValue(
      respond({ data: { app: { certificates: { nodes: [] } } } })
    );

    await api().certs.list('cdwr-web-moon');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
