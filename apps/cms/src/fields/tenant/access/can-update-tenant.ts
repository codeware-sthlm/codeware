import { getUserTenantIDs, hasRole } from '@codeware/shared/util/payload';
import type { FieldAccess } from 'payload/types';

/**
 * Allows system users to update the tenant field.
 *
 * Otherwise, only allow users with access to at least one tenant.
 */
export const canUpdateTenant: FieldAccess = (args) => {
  const {
    req: { user }
  } = args;

  if (hasRole(user, 'system-user')) {
    return true;
  }

  return getUserTenantIDs(user).length > 0;
};
