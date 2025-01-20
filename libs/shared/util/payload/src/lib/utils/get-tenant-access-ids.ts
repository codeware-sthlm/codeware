import type { Tenant, User } from '../generated/payload-types';
import { TenantRole } from '../types/custom-types';

import { getId } from './get-id';

/**
 * Get the tenant access IDs for a user.
 *
 * @param user - The user to get the tenant access IDs for.
 * @param limitToRole - The role to limit the access to (defaults to all roles).
 * @returns The tenant access IDs.
 */
export const getTenantAccessIDs = (
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
