import type { Access, Where } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';

/**
 * Permission to delete users
 *
 * - **No one can delete themselves**
 * - System users can delete all users
 * - Admin users can delete users in their own tenants
 */
export const canDeleteUsers: Access = (args) => {
  const {
    req: { user }
  } = args;

  if (!user) {
    return false;
  }

  const neverSelf: Where = {
    id: {
      not_equals: user.id
    }
  };

  if (hasRole(user, 'system-user')) {
    return neverSelf;
  }

  const adminTenantAccessIDs = getUserTenantIDs(user, 'admin');

  if (adminTenantAccessIDs.length === 0) {
    return false;
  }

  return {
    and: [
      neverSelf,
      {
        'tenants.tenant': {
          in: adminTenantAccessIDs
        }
      }
    ]
  };
};
