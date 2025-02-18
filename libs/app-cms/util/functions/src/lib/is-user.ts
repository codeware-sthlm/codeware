import type { User, UserAny } from '@codeware/shared/util/payload-types';
import type { TypeWithID } from 'payload';

/**
 * Check if the user is a collection user.
 * Resolve the proper user type.
 *
 * @param user - The user to check.
 * @returns `true` if the user is a collection user, `false` otherwise.
 */
export const isUser = <T extends TypeWithID = UserAny>(
  user: T | User | null
): user is User => {
  if (!user) {
    return false;
  }
  return 'role' in user && 'tenants' in user;
};
