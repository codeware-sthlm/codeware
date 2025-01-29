import { hasRole } from '@codeware/shared/util/payload';
import type { FieldAccess } from 'payload/types';

/**
 * Allows system users to create a tenant.
 */
export const canCreateTenant: FieldAccess = (args) => {
  const {
    req: { user }
  } = args;

  return hasRole(user, 'system-user');
};
