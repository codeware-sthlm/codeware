import type { Condition } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';

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
  if (hasRole(context.user, 'system-user')) {
    return true;
  }

  return getUserTenantIDs(context.user, 'admin').length > 0;
};
