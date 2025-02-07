import { hasRole } from '@codeware/app-cms/util/functions';
import type { User } from '@codeware/shared/util/payload-types';
import type { User as AuthUser } from 'payload/auth';

/**
 * Hide the tenants collection for users who are not system users.
 *
 * @param args - The arguments.
 * @returns True if the tenants collection should be hidden, false otherwise.
 */
export const hideTenantsCollection = (args: { user: AuthUser }) => {
  // @ts-expect-error Payload user type is not resolved correctly
  return !hasRole(args.user as User, 'system-user');
};
