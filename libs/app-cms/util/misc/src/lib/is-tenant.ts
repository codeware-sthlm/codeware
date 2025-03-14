import type { Tenant, UserAny } from '@codeware/shared/util/payload-types';
import type { TypeWithID } from 'payload';

/**
 * Check if the user is a collection tenant.
 * Resolve the proper tenant type.
 *
 * @param user - The user to check.
 * @returns `true` if the user is a collection tenant, `false` otherwise.
 */
export const isTenant = <T extends TypeWithID = UserAny>(
  user: T | Tenant | null
): user is Tenant => {
  if (!user) {
    return false;
  }
  return 'domains' in user;
};
