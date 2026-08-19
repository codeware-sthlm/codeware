import { readFileSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Adopting a custom domain at `onInit` rests on one assumption: Payload reads
 * `cors`, `csrf` and `serverURL` from the live config on every request, rather
 * than capturing them when the config is sanitized.
 *
 * That is true of the installed version and it is not a documented promise. If
 * an upgrade starts caching any of them, adoption stops working — silently, and
 * only for deployments that actually use a custom domain, which is the set of
 * deployments least likely to be exercised in development.
 *
 * So the assumption is pinned to Payload's own source. A failure here does not
 * mean Payload is broken; it means `adoptTenantDomains` needs another way in.
 */

// Read off disk rather than resolved: Payload's exports map does not expose
// these internals, and it is the shipped source this needs to look at
const payloadDist = join(
  resolve(__dirname, '../../../..'),
  'node_modules/payload/dist'
);

const source = (file: string) => readFileSync(join(payloadDist, file), 'utf8');

describe('payload reads request-time config', () => {
  it('resolves cors from the request payload instance', () => {
    // `headersWithCors` is what every endpoint answers through
    expect(source('utilities/headersWithCors.js')).toContain(
      'req?.payload?.config.cors'
    );
  });

  it('resolves csrf from the request payload instance', () => {
    // Cookie auth is refused for an origin that is not on this list
    expect(source('auth/extractJWT.js')).toContain('payload.config.csrf');
  });

  it('refuses a cookie from an origin outside csrf', () => {
    // The failure `DomainMismatchNotice` exists to explain: reach the admin on
    // a host that is not on this list and the session is silently dropped
    expect(source('auth/extractJWT.js')).toContain(
      'payload.config.csrf.includes(origin)'
    );
  });

  it('seeds csrf with the serverURL it was sanitized with', () => {
    // Adoption appends to that list rather than replacing it, which is what
    // keeps the Fly url accepting logins once a custom domain is adopted
    expect(source('config/sanitize.js')).toContain(
      'config.csrf.push(config.serverURL)'
    );
  });

  it('resolves serverURL from the config when sending mail', () => {
    // The link in a password reset is built from it at send time
    expect(source('auth/sendVerificationEmail.js')).toContain(
      'config.serverURL'
    );
  });
});
