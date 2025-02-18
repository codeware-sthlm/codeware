import type { Access, Where } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';

/**
 * Permission to update users
 *
 * - Users can update themselves
 * - System users can update all users
 * - Admin users can update users in their own tenants
 */
export const canUpdateUsers: Access = (args) => {
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
  const self: Where = { id: { equals: user.id } };

  return {
    or: [
      self,
      adminTenantAccessIDs.length
        ? {
            'tenants.tenant': {
              in: adminTenantAccessIDs
            }
          }
        : {}
    ]
  };
};
