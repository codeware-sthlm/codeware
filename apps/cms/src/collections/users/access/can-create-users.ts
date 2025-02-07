import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';
import type { User } from '@codeware/shared/util/payload-types';
import type { Access } from 'payload/types';

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

  const adminTenantAccessIDs = getUserTenantIDs(user, 'admin');

  if (adminTenantAccessIDs.length > 0) {
    return true;
  }

  return false;
};
