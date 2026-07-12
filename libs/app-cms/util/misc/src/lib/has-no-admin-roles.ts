import { UserAny } from '@codeware/shared/util/payload-types';

import { getUserTenantIDs } from './get-user-tenant-ids';
import { hasRole } from './has-role';

/**
 * Check if a user has no admin roles, meaning they are a regular user without any administrative privileges.
 *
 * @param user - The user to check.
 * @returns True if the user has no admin roles, false otherwise.
 */
export const hasNoAdminRoles = (user: UserAny | null): boolean => {
  return hasRole(user, 'user') && getUserTenantIDs(user, 'admin').length === 0;
};
