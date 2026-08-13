import type { Certificate } from '@cdwr/fly-node/api';
import { describe, expect, it } from 'vitest';

import { applyCertificateState, toCertificateState } from './certificate-state';
import type { TenantDomain } from './tenant-domain';

const now = new Date('2026-08-14T10:00:00.000Z');

const certificate = (overrides: Partial<Certificate> = {}): Certificate => ({
  hostname: 'tours.example.com',
  isConfigured: false,
  isApex: false,
  clientStatus: 'Awaiting configuration',
  dnsValidationHostname: '_acme-challenge.tours.example.com',
  dnsValidationTarget: 'tours.example.com.abc.flydns.net',
  dnsValidationInstructions: 'Add a CNAME record …',
  ...overrides
});

describe('toCertificateState', () => {
  it('keeps what the operator needs while they walk to their registrar', () => {
    expect(toCertificateState(certificate(), now)).toEqual({
      isConfigured: false,
      isApex: false,
      status: 'Awaiting configuration',
      checkedAt: '2026-08-14T10:00:00.000Z',
      dnsValidationHostname: '_acme-challenge.tours.example.com',
      dnsValidationTarget: 'tours.example.com.abc.flydns.net',
      dnsValidationInstructions: 'Add a CNAME record …',
      rateLimitedUntil: null
    });
  });

  it('records an issued certificate as serving', () => {
    const state = toCertificateState(
      certificate({ isConfigured: true, clientStatus: 'Ready' }),
      now
    );

    expect(state.isConfigured).toBe(true);
    expect(state.status).toBe('Ready');
  });

  it('carries a rate limit through, which correcting dns cannot fix', () => {
    const state = toCertificateState(
      certificate({ rateLimitedUntil: '2026-08-15T10:00:00Z' }),
      now
    );

    expect(state.rateLimitedUntil).toBe('2026-08-15T10:00:00Z');
  });

  it('takes isApex from Fly rather than counting labels', () => {
    // `example.co.uk` is an apex with three labels, so guessing would be wrong
    expect(toCertificateState(certificate({ isApex: true }), now).isApex).toBe(
      true
    );
  });

  it('reads a missing certificate as "not requested", not as an error', () => {
    const state = toCertificateState(null, now);

    expect(state).toMatchObject({ isConfigured: false, status: null });
    expect(state.checkedAt).toBe('2026-08-14T10:00:00.000Z');
  });

  it('stamps when it was true, so a stale answer stays honest', () => {
    expect(toCertificateState(null).checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('applyCertificateState', () => {
  const domains: Array<TenantDomain> = [
    { hostname: 'a.example.com', app: 'web' },
    { hostname: 'b.example.com', app: 'web', isPrimary: true }
  ];

  it('touches only the row it names', () => {
    const state = toCertificateState(certificate(), now);
    const result = applyCertificateState(domains, 'a.example.com', state);

    expect(result[0].certificate).toEqual(state);
    expect(result[1]).toEqual(domains[1]);
  });

  it('keeps the other fields on the row it updates', () => {
    const result = applyCertificateState(
      domains,
      'b.example.com',
      toCertificateState(null, now)
    );

    expect(result[1]).toMatchObject({
      hostname: 'b.example.com',
      app: 'web',
      isPrimary: true
    });
  });

  it('forgets the certificate of a removed domain', () => {
    const withState = applyCertificateState(
      domains,
      'a.example.com',
      toCertificateState(certificate(), now)
    );

    expect(
      applyCertificateState(withState, 'a.example.com', null)[0].certificate
    ).toBeNull();
  });

  it('returns every row, so a partial write cannot drop the rest', () => {
    // Payload replaces the whole array field on update
    expect(
      applyCertificateState(domains, 'nobody.example.com', null)
    ).toHaveLength(2);
  });

  it('does not edit the array it was given', () => {
    applyCertificateState(domains, 'a.example.com', toCertificateState(null));

    expect(domains[0]).not.toHaveProperty('certificate');
  });
});
