import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/misc';
import type { PayloadRequest } from 'payload';

/**
 * Access control supporting both collection and field level.
 *
 * Allows access if the user has the `system-user` role
 * or is a tenant admin for any of the tenants it belongs to.
 */
export const systemUserOrTenantAdminAccess = <
  T extends { req: PayloadRequest }
>({
  req: { user }
}: T): boolean =>
  hasRole(user, 'system-user') || getUserTenantIDs(user, 'admin').length > 0;
