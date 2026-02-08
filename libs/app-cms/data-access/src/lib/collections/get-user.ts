import type { User } from '@codeware/shared/util/payload-types';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single user by id with proper access control.
 *
 * Returns null if the user is not found or the current user doesn't have access.
 *
 * Default options:
 * - depth: 1
 *
 * @param payload - Authenticated Payload instance
 * @param id - ID of the user to fetch
 * @param options - Optional query options
 * @returns User or null
 */
export async function getUser(
  payload: AuthenticatedPayload,
  id: string,
  options: Pick<QuerySingleOptions, 'depth'> = {}
): Promise<User | null> {
  const { depth = 1 } = options;

  try {
    const user = await payload.findByID({
      collection: 'users',
      id,
      depth,
      overrideAccess: false,
      user: payload.authenticatedUser
    });

    return user;
  } catch {
    // User not found or access denied
    return null;
  }
}
