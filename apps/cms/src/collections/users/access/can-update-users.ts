import type { User } from '@codeware/shared/util/payload';
import type { Access, Where } from 'payload/types';

import { getTenantAccessIDs } from '../../../utils/get-tenant-access-ids';
import { hasRole } from '../../../utils/has-role';

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

  const adminTenantAccessIDs = getTenantAccessIDs(user, 'admin');

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
