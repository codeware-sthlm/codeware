import type { Access } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';

/**
 * Permission to create users
 *
 * - System users can create users
 * - Admin users can create users
 */
export const canCreateUsers: Access = (args) => {
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

  if (adminTenantAccessIDs.length > 0) {
    return true;
  }

  return false;
};
