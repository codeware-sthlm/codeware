import type { Condition } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';
import type { User } from '@codeware/shared/util/payload-types';
/**
 * Show the tenant field for system users or
 * users with access to multiple tenants.
 */
export const showTenantField: Condition = (data, siblingData, context) => {
  const user = context.user as User;

  if (hasRole(user, 'system-user')) {
    return true;
  }

  if (getUserTenantIDs(user).length > 1) {
    return true;
  }

  return false;
};
