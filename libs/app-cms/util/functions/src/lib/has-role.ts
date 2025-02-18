import type { User, UserAny } from '@codeware/shared/util/payload-types';

import { isUser } from './is-user';

/**
 * Check if a user has a specific role.
 *
 * @param user - The user to check.
 * @param role - The user role to check for.
 * @returns True if the user has the role, false otherwise.
 */
export const hasRole = (user: UserAny | null, role: User['role']): boolean => {
  if (!isUser(user)) {
    return false;
  }
  return user.role === role;
};
