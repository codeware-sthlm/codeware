import { Payload } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import type { Tenant } from '@codeware/shared/util/payload-types';
import { resolveTenantSeedFromSlug } from '@codeware/shared/util/seed';

/**
 * Resolves the active tenant based on the current deployment's API key in tenant mode.
 * @param payload - The Payload instance for database access
 * @returns The active Tenant or undefined if not in tenant mode or tenant not found
 */
export const resolveScopedTenant = async (
  payload: Payload
): Promise<Tenant | undefined> => {
  const { APP_MODE, DEPLOY_ENV } = getEnv();

  if (APP_MODE.type !== 'tenant') {
    return undefined;
  }

  // Resolve the active tenant API key.
  let apiKey = APP_MODE.apiKey || null;

  if (!apiKey) {
    // "Just in case" guard
    if (DEPLOY_ENV !== 'development') {
      payload.logger.warn(
        'Tenant API key not set in environment variables. Ensure PAYLOAD_API_KEY is set.'
      );
      return undefined;
    }

    const seedTenant = await resolveTenantSeedFromSlug(APP_MODE.tenantId);
    apiKey = seedTenant?.apiKey ?? null;
  }

  if (!apiKey) {
    return undefined;
  }

  // The apiKey field is hashed in the DB index and cannot be matched via
  // a WHERE clause. Fetch all tenants and match in JS — same pattern used
  // by restrictToTenantInTenantMode for the same reason.
  const { docs } = await payload.find({
    collection: 'tenants',
    overrideAccess: true,
    pagination: false
  });

  return docs.find((t) => t.apiKey === apiKey);
};
