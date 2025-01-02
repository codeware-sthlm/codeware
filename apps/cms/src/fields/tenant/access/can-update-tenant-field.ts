import type { FieldAccess } from 'payload/types';

import { getTenantAccessIDs } from '../../../utils/get-tenant-access-ids';
import { hasRole } from '../../../utils/has-role';

/**
 * Allows system users to update the tenant field.
 *
 * Otherwise, only allow users with access to at least one tenant.
 */
export const canUpdateTenantField: FieldAccess = (args) => {
  const {
    req: { user }
  } = args;

  if (hasRole(user, 'system-user')) {
    return true;
  }

  return getTenantAccessIDs(user).length > 0;
};
