import type { User } from '@codeware/shared/util/payload';
import { getUserTenantIDs, hasRole } from '@codeware/shared/util/payload';
import type { Access, Where } from 'payload/types';

/**
 * Permission to update users
 *
 * - Users can update themselves
 * - System users can update all users
 * - Admin users can update users in their own tenants
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const canUpdateUsers: Access<any, User> = (args) => {
  const {
    req: { user }
  } = args;

  if (!user) {
    return false;
  }

  if (hasRole(user, 'system-user')) {
    return true;
  }

  const adminTenantAccessIDs = getUserTenantIDs(user, 'admin');

  return {
    or: [
      { id: { equals: user.id } },
      adminTenantAccessIDs.length
        ? {
            'tenants.tenant': {
              in: adminTenantAccessIDs
            }
          }
        : {}
    ]
  } as Where;
};
