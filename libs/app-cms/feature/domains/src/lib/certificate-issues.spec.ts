import { describe, expect, it } from 'vitest';

import { describeCertificateIssues } from './certificate-issues';

describe('describeCertificateIssues', () => {
  it('prefers Fly’s own prose over a live check’s codes', () => {
    const issues = describeCertificateIssues(
      { validationErrors: ['No AAAA records were found for your domain'] },
      { errors: ['IPV6_NOT_FOUND'] }
    );

    expect(issues).toEqual(['No AAAA records were found for your domain']);
  });

  it('humanizes a live check’s codes when there is no prose yet', () => {
    // The common case for a freshly requested certificate: Fly has not
    // failed an issuance attempt, so there is no prose, only a live check
    const issues = describeCertificateIssues(
      { validationErrors: null },
      { errors: ['IPV6_NOT_FOUND', 'DNS_NOT_CONFIGURED'] }
    );

    expect(issues).toEqual(['IPV6 not found', 'DNS not configured']);
  });

  it('returns nothing when neither source has anything to say', () => {
    expect(describeCertificateIssues(null, null)).toEqual([]);
    expect(
      describeCertificateIssues({ validationErrors: null }, { errors: null })
    ).toEqual([]);
    expect(describeCertificateIssues({ validationErrors: null }, null)).toEqual(
      []
    );
  });

  it('humanizes a code with no known acronym without throwing it away', () => {
    expect(
      describeCertificateIssues(null, { errors: ['RATE_LIMITED'] })
    ).toEqual(['Rate limited']);
  });

  it('ignores stored prose on an issued certificate, even if present', () => {
    // validationErrors is a log of past failed attempts with no timestamps —
    // an issued certificate outgrew whatever it says, so only a live check
    // may speak about it
    const issues = describeCertificateIssues(
      {
        isConfigured: true,
        validationErrors: ['No AAAA records were found for your domain']
      },
      { errors: ['DNS_NOT_CONFIGURED'] }
    );

    expect(issues).toEqual(['DNS not configured']);
  });

  it('reports nothing for an issued certificate with no live check', () => {
    expect(
      describeCertificateIssues(
        {
          isConfigured: true,
          validationErrors: ['No AAAA records were found for your domain']
        },
        null
      )
    ).toEqual([]);
  });
});
