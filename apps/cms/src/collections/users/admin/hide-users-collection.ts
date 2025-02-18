import type { User } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';

/**
 * Hide the users collection for users without any admin roles.
 *
 * @param args - The arguments.
 * @returns True if the users collection should be hidden, false otherwise.
 */
export const hideUsersCollection = (args: { user: User }) => {
  // System users are always allowed to access the users collection
  if (hasRole(args.user, 'system-user')) {
    return false;
  }

  // Tenant users are only allowed to access the users collection if they have any admin roles
  return getUserTenantIDs(args.user, 'admin').length === 0;
};
