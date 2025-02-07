import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';
import type { User } from '@codeware/shared/util/payload-types';
import type { Condition } from 'payload/types';

/**
 * Show the tenants field for system users or
 * users with admin access to at least one tenant.
 *
 * TODO: Refine access logic for tenant admins
 * A user can belong to multiple tenants with different roles,
 * grouped in the `tenants` array field.
 * Is it better/possible that tenant admins only see their own tenants
 * in the `tenants` array field?
 */
export const showTenantsField: Condition = (data, siblingData, context) => {
  // @ts-expect-error Generated user type is not inferred
  const user = context.user as User;

  if (hasRole(user, 'system-user')) {
    return true;
  }

  return getUserTenantIDs(user, 'admin').length > 0;
};
