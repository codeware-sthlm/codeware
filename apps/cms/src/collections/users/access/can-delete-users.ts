import type { Access, Where } from 'payload/types';

import type { User } from '../../../generated/payload-types';
import { getTenantAccessIDs } from '../../../utils/get-tenant-access-ids';
import { hasRole } from '../../../utils/has-role';

/**
 * Permission to delete users
 *
 * - **No one can delete themselves**
 * - System users can delete all users
 * - Admin users can delete users in their own tenants
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const canDeleteUsers: Access<any, User> = (args) => {
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

  const adminTenantAccessIDs = getTenantAccessIDs(user, 'admin');

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