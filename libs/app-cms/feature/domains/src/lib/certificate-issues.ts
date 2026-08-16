import type { HostnameCheck } from '@cdwr/fly-node/api';

/** Short technical words worth keeping upper-case in a humanized code */
const ACRONYMS = new Set([
  'dns',
  'acme',
  'ipv4',
  'ipv6',
  'txt',
  'cname',
  'ttl',
  'caa',
  'soa'
]);

/**
 * Turn a Fly error code into something readable, since none of them come
 * with a translation. `IPV6_NOT_FOUND` becomes `IPV6 not found` — not as
 * polished as a hand-written sentence, but nothing a reader has to decode.
 */
const humanize = (code: string): string =>
  code
    .toLowerCase()
    .split('_')
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word))
    .join(' ')
    .replace(/^./, (char) => char.toUpperCase());

/**
 * What to tell a domain's owner is wrong, in words rather than codes.
 *
 * Fly describes a problem two different ways depending on when it is asked.
 * `AppCertificate.validationErrors` is prose, written once Let's Encrypt has
 * actually tried and failed — the same wording Fly's own dashboard shows.
 * `HostnameCheck.errors` is available earlier, before any attempt has been
 * made, but only as SCREAMING_SNAKE_CASE codes with no prose counterpart.
 *
 * The prose wins whenever there is any, since it is Fly's own words rather
 * than a guess at what a code means. The codes are humanized rather than
 * shown raw only because nothing better exists yet for that earlier state.
 *
 * @param certificate - Stored state, which is where validation prose lives.
 * Loosely typed rather than `Pick<CertificateState, ...>` because Payload's
 * generated row type makes every stored field optional, not just nullable
 * @param check - A live dns check, only present right after one was run
 */
export const describeCertificateIssues = (
  certificate: { validationErrors?: Array<string> | null } | null | undefined,
  check: Pick<HostnameCheck, 'errors'> | null | undefined
): Array<string> => {
  if (certificate?.validationErrors?.length) {
    return certificate.validationErrors;
  }

  return (check?.errors ?? []).map(humanize);
};
