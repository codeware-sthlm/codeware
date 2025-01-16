import type { User } from '@codeware/shared/util/payload';
import type { Condition } from 'payload/types';

import { getTenantAccessIDs } from '../../../utils/get-tenant-access-ids';
import { hasRole } from '../../../utils/has-role';

/**
 * Show the tenant field for system users or
 * users with access to multiple tenants.
 */
export const showTenantField: Condition = (data, siblingData, context) => {
  // @ts-expect-error Generated user type is not inferred
  const user = context.user as User;

  if (hasRole(user, 'system-user')) {
    return true;
  }

  if (getTenantAccessIDs(user).length > 1) {
    return true;
  }

  return false;
};
