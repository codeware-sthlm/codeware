import type { Tenant } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

/**
 * The apiKey field is hashed in the DB index and cannot be matched via a WHERE
 * clause, so the only way to resolve a tenant from its key is to read them all
 * and compare in JS.
 *
 * Access control calls this per collection per operation, which made a single
 * admin render resolve the same tenant hundreds of times. The identity is
 * pinned by the deployment's API key, so it only needs re-reading often enough
 * to pick up an edited tenant doc.
 */
const CACHE_TTL_MS = 10_000;

const cache = new Map<
  string,
  { at: number; promise: Promise<Tenant | undefined> }
>();

export const findTenantByApiKey = (
  payload: Payload,
  apiKey: string
): Promise<Tenant | undefined> => {
  const cached = cache.get(apiKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = payload
    .find({
      collection: 'tenants',
      overrideAccess: true,
      pagination: false,
      // Callers only need `id` (and `apiKey` to match on), so skip relationship
      // population on what is an access-control hot path
      depth: 0
    })
    .then(({ docs }) => docs.find((t) => t.apiKey === apiKey))
    .catch((error) => {
      // Never cache a failed lookup — the next call should retry
      cache.delete(apiKey);
      throw error;
    });

  cache.set(apiKey, { at: Date.now(), promise });
  return promise;
};
