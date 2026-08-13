/** Why a hostname cannot serve a tenant */
export type HostnameProblem =
  | 'empty'
  | 'hasScheme'
  | 'hasPath'
  | 'hasPort'
  | 'isWildcard'
  | 'tooLong'
  | 'tooFewLabels'
  | 'invalidLabel'
  | 'numericTld';

export type HostnameResult =
  | { valid: true; hostname: string }
  | { valid: false; problem: HostnameProblem };

/** A DNS label: 1-63 chars, alphanumeric or hyphen, never hyphen-edged */
const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/** The longest a fully qualified name may be */
const MAX_LENGTH = 253;

/**
 * Read a hostname the way a certificate will have to.
 *
 * Runs before anything is stored, because the alternatives are all worse: Fly
 * rejects a malformed hostname with its own wording, DNS instructions get
 * generated for a name that can never validate, and a typo sits in the tenant
 * record looking configured.
 *
 * Deliberately not decided here:
 * - **Whether the name is an apex.** Telling `example.com` from `example.co.uk`
 *   needs the public suffix list, and guessing at label count would be wrong for
 *   every multi-part suffix. Fly reports `isApex` on the certificate, which is
 *   authoritative - use that.
 * - **Whether the name resolves.** That is what the certificate check is for.
 *
 * @param value - Hostname as typed, e.g. ` Tours.Example.com `
 * @returns The normalized hostname, or why it cannot be used
 */
export const parseHostname = (value: string): HostnameResult => {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, problem: 'empty' };
  }

  // Checked before anything else, so pasting a browser url says what is wrong
  // rather than failing on the slash it happens to contain
  if (/^[a-z][a-z0-9+.-]*:\/\//.test(trimmed)) {
    return { valid: false, problem: 'hasScheme' };
  }

  if (/[/?#]/.test(trimmed)) {
    return { valid: false, problem: 'hasPath' };
  }

  if (trimmed.includes(':')) {
    return { valid: false, problem: 'hasPort' };
  }

  if (trimmed.includes('*')) {
    // A wildcard certificate needs a DNS-01 challenge, which means handing the
    // platform control of the customer's dns. Out of scope on purpose.
    return { valid: false, problem: 'isWildcard' };
  }

  // A trailing dot is a valid fully qualified name, but Fly stores the bare
  // form and two rows differing only by that dot would look like two domains
  const hostname = trimmed.replace(/\.$/, '');

  if (hostname.length > MAX_LENGTH) {
    return { valid: false, problem: 'tooLong' };
  }

  const labels = hostname.split('.');

  if (labels.length < 2) {
    return { valid: false, problem: 'tooFewLabels' };
  }

  if (!labels.every((label) => LABEL.test(label))) {
    return { valid: false, problem: 'invalidLabel' };
  }

  // No top-level domain is all digits, so this is how an ip address arrives -
  // and a certificate for one is not something Let's Encrypt will ever issue
  if (/^\d+$/.test(labels[labels.length - 1])) {
    return { valid: false, problem: 'numericTld' };
  }

  return { valid: true, hostname };
};
