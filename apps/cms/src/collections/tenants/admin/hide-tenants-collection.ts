import type { User } from 'payload';

import { hasRole } from '@codeware/app-cms/util/functions';

/**
 * Hide the tenants collection for users who are not system users.
 *
 * @param args - The arguments.
 * @returns True if the tenants collection should be hidden, false otherwise.
 */
export const hideTenantsCollection = (args: { user: User }) => {
  return !hasRole(args.user, 'system-user');
};
