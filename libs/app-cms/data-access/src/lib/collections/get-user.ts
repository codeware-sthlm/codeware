import type { User } from '@codeware/shared/util/payload-types';
import type { BasePayload } from 'payload';

import { mapToRuntime } from '../map-to-runtime';
import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single user by id.
 *
 * Returns null if the user is not found or the current user doesn't have access.
 *
 * Default options:
 * - depth: 1
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime or BasePayload instance
 * @param id - ID of the user to fetch
 * @param options - Optional query options
 * @returns User or null
 */
export async function getUser(
  runtime: PayloadRuntime | BasePayload,
  id: string,
  options: QuerySingleOptions = {}
): Promise<User | null> {
  const { payload, tenantConfig } = mapToRuntime(runtime);
  const { depth = 1, locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const user = await payload.findByID({
    collection: 'users',
    id,
    depth,
    locale: locale ?? tenantConfig?.locale,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return user;
}
