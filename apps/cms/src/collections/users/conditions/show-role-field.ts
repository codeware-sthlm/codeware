import { hasRole } from '@codeware/shared/util/payload';
import type { Condition } from 'payload/types';

/**
 * Show the role field for system users.
 */
export const showRoleField: Condition = (data, siblingData, context) => {
  // @ts-expect-error Generated user type is not inferred
  const user = context.user as User;

  return hasRole(user, 'system-user');
};
