import type {
  Tenant,
  TenantRole,
  User
} from '@codeware/shared/util/payload-types';

import { getId } from './get-id';

/**
 * Get the tenant IDs the user has access to.
 *
 * @param user - The user to get the tenant IDs for.
 * @param limitToRole - The role to limit the access to (defaults to all roles).
 * @returns The tenant IDs the user has access to.
 */
export const getUserTenantIDs = (
  user: User | null,
  limitToRole?: TenantRole
): Array<Tenant['id']> => {
  if (!user) {
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
