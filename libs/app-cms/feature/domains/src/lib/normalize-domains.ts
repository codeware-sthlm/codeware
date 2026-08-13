import type { CollectionBeforeValidateHook } from 'payload';

import { parseHostname } from './parse-hostname';
import type { TenantWithDomains } from './tenant-domain';

/**
 * Store every domain in one canonical form.
 *
 * `Tours.Example.com.` and `tours.example.com` are the same domain, and a
 * certificate exists for exactly one spelling of it. Left as typed, the two
 * would sit in the table as separate rows, only one of which matches what Fly
 * holds — and the duplicate check further down would not see them as a pair.
 *
 * Runs before field validation, so the admin echoes back what will actually be
 * saved instead of correcting it silently after the fact. A hostname that
 * cannot be parsed is left alone for `validateHostname` to explain.
 */
export const normalizeDomains: CollectionBeforeValidateHook<
  TenantWithDomains
> = ({ data }) => {
  if (!data?.domains?.length) {
    return data;
  }

  return {
    ...data,
    domains: data.domains.map((domain) => {
      const result = domain.hostname
        ? parseHostname(domain.hostname)
        : { valid: false as const, problem: 'empty' as const };

      return result.valid ? { ...domain, hostname: result.hostname } : domain;
    })
  };
};
