import type {
  Tenant,
  TenantRole,
  UserAny
} from '@codeware/shared/util/payload-types';

import { getId } from './get-id';
import { isUser } from './is-user';

/**
 * Get the tenant IDs the user has access to.
 *
 * @param user - The user to get the tenant IDs for.
 * @param limitToRole - The role to limit the access to (defaults to all roles).
 * @returns The tenant IDs the user has access to.
 */
export const getUserTenantIDs = (
  user: UserAny | null,
  limitToRole?: TenantRole
): Array<Tenant['id']> => {
  if (!isUser(user)) {
    return [];
  }

  return (
    user.tenants?.reduce(
      (acc, { role, tenant }) => {
        if (tenant) {
          if (!limitToRole || limitToRole === role) {
            acc.push(getId(tenant));
          }
        }
        return acc;
      },
      [] as Array<Tenant['id']>
    ) || []
  );
};
