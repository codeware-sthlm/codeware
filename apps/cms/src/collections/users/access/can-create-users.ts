import type { Access } from 'payload/types';

import type { User } from '../../../generated/payload-types';
import { getTenantAccessIDs } from '../../../utils/get-tenant-access-ids';
import { hasRole } from '../../../utils/has-role';

/**
 * Permission to create users
 *
 * - System users can create users
 * - Admin users can create users
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const canCreateUsers: Access<any, User> = (args) => {
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

  if (adminTenantAccessIDs.length > 0) {
    return true;
  }

  return false;
};
