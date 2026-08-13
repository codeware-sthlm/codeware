import type { Credentials } from './create-client';
import { isNotFound } from './error-status';
import type { Environment } from './infisical.schemas';
import { withInfisical } from './with-infisical';

/** Folder every third-party provider keeps its credentials under */
const INTEGRATIONS_PATH = '/integrations';

/** How long a fetched set stays usable before it is read again */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/** Secret keys of one provider, e.g. `{ API_TOKEN: 'fly_...' }` */
export type IntegrationCredentials = Record<string, string>;

type Options<TEnv> = Credentials & {
  /**
   * The environment to read from.
   *
   * Defaults to `'development'`.
   */
  environment?: TEnv;

  /**
   * How long a fetched set is cached, in milliseconds.
   *
   * Pass `0` to read from Infisical every time.
   *
   * Defaults to five minutes.
   */
  ttlMs?: number;
};

type Entry = { credentials: IntegrationCredentials; expiresAt: number };

const cache = new Map<string, Entry>();

/**
 * Credentials for a third-party provider, read from `/integrations/<provider>`.
 *
 * These are platform-wide rather than per app or per tenant: one Fly token
 * manages certificates for every tenant's app. That is also why they are read on
 * demand instead of injected into `process.env` at boot like the rest - an
 * org-scoped token is the most powerful secret the platform holds, and one that
 * never enters the environment cannot leak through a child process, a crash
 * dump or a stray env dump.
 *
 * Reading per call would mean an authentication round trip behind every button
 * press, so a set stays cached for `ttlMs`. A rotated secret is picked up on the
 * next expiry, or immediately after `clearIntegrationCredentials()`.
 *
 * An unconfigured provider is an answer, not a fault: the folder simply does not
 * exist yet, and the feature it powers is unavailable until someone adds it.
 * Callers get an empty object and decide what that means.
 *
 * @param provider - Folder name under `/integrations`, e.g. `fly`
 * @returns The provider's secrets keyed by name, empty when unconfigured
 * @throws An error if Infisical credentials are missing or the read fails
 */
export const getIntegrationCredentials = async <TEnv = Environment>(
  provider: string,
  options: Options<TEnv> = {}
): Promise<IntegrationCredentials> => {
  const { environment, ttlMs = DEFAULT_TTL_MS, ...credentials } = options;

  // A process normally talks to one project, but the key stays honest about it
  const projectId =
    credentials.projectId || process.env['INFISICAL_PROJECT_ID'] || '';
  const cacheKey = `${projectId}|${String(environment ?? '')}|${provider}`;

  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.credentials;
  }

  let credentialSet: IntegrationCredentials = {};

  try {
    const secrets = await withInfisical({
      ...credentials,
      environment,
      filter: { path: `${INTEGRATIONS_PATH}/${provider}`, recurse: false }
    });

    credentialSet = Object.fromEntries(
      secrets.map(({ secretKey, secretValue }) => [secretKey, secretValue])
    );
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  // Cache the empty answer too - an unconfigured provider should not cost a
  // round trip on every render of a panel that offers to configure it
  if (ttlMs > 0) {
    cache.set(cacheKey, {
      credentials: credentialSet,
      expiresAt: Date.now() + ttlMs
    });
  }

  return credentialSet;
};

/**
 * Forget cached credentials, so the next read goes to Infisical.
 *
 * @param provider - Provider to forget, or every provider when omitted
 */
export const clearIntegrationCredentials = (provider?: string): void => {
  if (!provider) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.endsWith(`|${provider}`)) {
      cache.delete(key);
    }
  }
};
