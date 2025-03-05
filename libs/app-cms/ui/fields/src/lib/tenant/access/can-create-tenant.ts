import { hasRole } from '@codeware/app-cms/util/functions';
import type { FieldAccess } from 'payload';

/**
 * Allows system users to create a tenant.
 */
export const canCreateTenant: FieldAccess = (args) => {
  const {
    req: { user }
  } = args;

  return hasRole(user, 'system-user');
};
