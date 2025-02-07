import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';
import type { User } from '@codeware/shared/util/payload-types';
import type { User as AuthUser } from 'payload/auth';

/**
 * Hide the users collection for users without any admin roles.
 *
 * @param args - The arguments.
 * @returns True if the users collection should be hidden, false otherwise.
 */
export const hideUsersCollection = (args: { user: AuthUser }) => {
  // @ts-expect-error Payload user type is not resolved correctly
  const user = args.user as User;

  // System users are always allowed to access the users collection
  if (hasRole(user, 'system-user')) {
    return false;
  }

  // Tenant users are only allowed to access the users collection if they have any admin roles
  return getUserTenantIDs(user, 'admin').length === 0;
};
