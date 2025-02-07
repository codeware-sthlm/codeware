import type { User } from '@codeware/shared/util/payload-types';

/**
 * Check if a user has a specific role.
 *
 * @param user - The user to check.
 * @param role - The user role to check for.
 * @returns True if the user has the role, false otherwise.
 */
export const hasRole = (user: User | null, role: User['role']): boolean => {
  if (!user) {
    return false;
  }

  return user.role === role;
};
