import type { Tenant } from '@codeware/shared/util/payload-types';
import type { BasePayload } from 'payload';

import { mapToRuntime } from '../map-to-runtime';
import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single tenant by id.
 *
 * Returns null if the tenant is not found or the current user doesn't have access.
 *
 * Default options:
 * - depth: 1
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime or BasePayload instance
 * @param id - ID of the tenant to fetch
 * @param options - Optional query options
 * @returns Tenant or null
 */
export async function getTenant(
  runtime: PayloadRuntime | BasePayload,
  id: number | string,
  options: QuerySingleOptions = {}
): Promise<Tenant | null> {
  const { payload, tenantConfig } = mapToRuntime(runtime);
  const { depth = 1, locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const tenant = await payload.findByID({
    collection: 'tenants',
    id,
    depth,
    locale: locale ?? tenantConfig?.locale,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return tenant;
}
