import type { User } from '@codeware/shared/util/payload';
import {
  getUserTenantIDs,
  hasRole,
  parseCookies
} from '@codeware/shared/util/payload';
import type { Access, Where } from 'payload/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const canReadTenant: Access<any, User> = (args) => {
  const {
    req: { headers, payload, user }
  } = args;

  // System user can read all
  if (hasRole(user, 'system-user')) {
    return true;
  }

  const cookieName = `${payload.config.cookiePrefix}-tenant`;

  const tenantIDs = getUserTenantIDs(user);
  const selectedTenant = parseCookies(headers)[cookieName];

  // Scoped to a tenant via cookie
  if (selectedTenant) {
    const hasTenantAccess = tenantIDs.some(
      (id) => id.toString() === selectedTenant
    );

    // Tenant members has access to the tenant
    if (hasTenantAccess) {
      return {
        id: {
          equals: selectedTenant
        }
      } as Where;
    }

    // Other users have no access to the selected tenant
    return false;
  }

  // No tenant scope

  // Users have access to their own tenants
  if (tenantIDs.length) {
    return {
      id: {
        in: tenantIDs
      }
    };
  }

  // Deny access to all tenants
  return false;
};
