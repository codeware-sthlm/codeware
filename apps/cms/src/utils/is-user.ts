import type { Tenant, User } from '../generated/payload-types';

/**
 * Check if the user is a collection user.
 * Resolve the proper user type.
 *
 * @param user - The user to check.
 * @returns `true` if the user is a collection user, `false` otherwise.
 */
export const isUser = (user: User | Tenant | null): user is User => {
  return !!user && 'role' in user;
};
