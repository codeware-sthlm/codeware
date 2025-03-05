import type { Access, Where } from 'payload';

import {
  getUserTenantIDs,
  hasRole,
  parseCookies
} from '@codeware/app-cms/util/functions';

/**
 * Permission to read users.
 *
 * Only authenticated users have access to users.
 *
 * - Tenant is scoped via cookie
 *   - System users have access to all scoped tenant users
 *   - Tenant admins have access to all scoped tenant users
 *   - Other users have access to themselves if scoped tenant member
 *
 * - No tenant scope
 *   - System users have access to all users
 *   - Tenant admins have access to all users in their own tenants
 *   - Users have access to themselves
 */
export const canReadUsers: Access = (args) => {
  const {
    req: { headers, payload, user }
  } = args;

  if (!user) {
    return false;
  }

  const cookieName = `${payload.config.cookiePrefix}-tenant`;
  const self: Where = { id: { equals: user.id } };

  const adminTenantAccessIDs = getUserTenantIDs(user, 'admin');
  const selectedTenant = parseCookies(headers)[cookieName];
  const systemUser = hasRole(user, 'system-user');

  // Scoped to a tenant via cookie
  if (selectedTenant) {
    const hasTenantAccess = adminTenantAccessIDs.some(
      (id) => id.toString() === selectedTenant
    );

    // System users and tenant admins for the selected tenant
    // has access to all tenant users and themselves
    if (systemUser || hasTenantAccess) {
      return {
        or: [
          self,
          {
            'tenants.tenant': {
              equals: selectedTenant
            }
          }
        ]
      };
    }

    // Other users have only access to themselves
    return self;
  }

  // No tenant scope

  // System users have access to all users
  if (systemUser) {
    return true;
  }

  // Users have access to themselves and
  // tenant admins have access to all users in their own tenants
  return {
    or: [
      self,
      adminTenantAccessIDs.length
        ? {
            'tenants.tenant': {
              in: adminTenantAccessIDs
            }
          }
        : {}
    ]
  };
};
