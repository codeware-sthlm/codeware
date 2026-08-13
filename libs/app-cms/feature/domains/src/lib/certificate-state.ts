import { type Certificate, FlyApi } from '@cdwr/fly-node/api';

import type { TenantDomain } from './tenant-domain';

/** What a domain row stores about its certificate */
export type CertificateState = {
  isConfigured: boolean;
  isApex: boolean;
  status: string | null;
  checkedAt: string;
  dnsValidationHostname: string | null;
  dnsValidationTarget: string | null;
  dnsValidationInstructions: string | null;
  rateLimitedUntil: string | null;
};

/**
 * Fold a Fly certificate into the fields a domain row keeps.
 *
 * Stored rather than fetched on every render for two reasons: the tenant view
 * should not go down with Fly, and the boot read that decides which url an app
 * calls its own cannot make a network call at all. `checkedAt` is what keeps
 * that honest — a stale answer is fine as long as it says when it was true.
 *
 * The dns fields come along because they are what the operator needs *while*
 * they walk away to their registrar. Holding them only in the browser would
 * lose them on the first reload, at exactly the wrong moment.
 *
 * @param certificate - What Fly returned, or `null` when none exists yet
 * @param now - Injectable clock, so a test can assert the stamp
 */
export const toCertificateState = (
  certificate: Certificate | null,
  now: Date = new Date()
): CertificateState => {
  const checkedAt = now.toISOString();

  if (!certificate) {
    // Not an error - nobody has requested one yet, and the panel says so
    return {
      isConfigured: false,
      isApex: false,
      status: null,
      checkedAt,
      dnsValidationHostname: null,
      dnsValidationTarget: null,
      dnsValidationInstructions: null,
      rateLimitedUntil: null
    };
  }

  const dns = FlyApi.dnsInstructions(certificate);

  return {
    isConfigured: certificate.isConfigured,
    isApex: certificate.isApex ?? false,
    status: certificate.clientStatus ?? null,
    checkedAt,
    dnsValidationHostname: dns.hostname ?? null,
    dnsValidationTarget: dns.target ?? null,
    dnsValidationInstructions: dns.instructions ?? null,
    rateLimitedUntil: certificate.rateLimitedUntil ?? null
  };
};

/**
 * Write one domain's certificate state back into the tenant's rows.
 *
 * Returns a new array rather than editing in place, and touches only the row
 * whose hostname matches: an update writes the whole `domains` field back, so
 * rebuilding it from anything less than every row would quietly drop the
 * others.
 *
 * @param state - Fresh state, or `null` to forget a removed certificate
 */
export const applyCertificateState = <T extends TenantDomain>(
  domains: Array<T>,
  hostname: string,
  state: CertificateState | null
): Array<T> =>
  domains.map((domain) =>
    domain.hostname === hostname
      ? // The generated row type states the certificate group more narrowly
        // than the loose read shape, and a fresh state satisfies both
        ({ ...domain, certificate: state } as T)
      : domain
  );
