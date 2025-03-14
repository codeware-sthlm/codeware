import type { Access } from 'payload';

import {
  getId,
  getUserTenantIDs,
  hasRole,
  isUser
} from '@codeware/app-cms/util/misc';
import type { User } from '@codeware/shared/util/payload-types';

/**
 * This access control ensures that only users with admin access
 * to all tenants in current document has access.
 *
 * System users always have access.
 *
 * @param selfRule - Optionally force allow or deny access to the user themselves.
 */
export const adminAccessToAllDocTenants =
  (selfRule?: 'allowSelf' | 'denySelf'): Access<User> =>
  ({ data, req: { user } }) => {
    if (!isUser(user)) {
      return false;
    }

    // Allow list access
    if (!data?.tenants) {
      return true;
    }

    // System users always have access
    if (hasRole(user, 'system-user')) {
      return true;
    }

    // Apply self rule if specified
    if (selfRule && data.id === user.id) {
      return selfRule === 'allowSelf';
    }

    // Users have access to other users if they have admin access to all of the users tenants
    const userAdminTenantIds = getUserTenantIDs(user, 'admin');
    return data.tenants.every((t) =>
      userAdminTenantIds.includes(getId(t.tenant))
    );
  };
