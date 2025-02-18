import type { Condition } from 'payload';

import { hasRole } from '@codeware/app-cms/util/functions';

/**
 * Show the role field for system users.
 */
export const showRoleField: Condition = (data, siblingData, context) => {
  return hasRole(context.user, 'system-user');
};
