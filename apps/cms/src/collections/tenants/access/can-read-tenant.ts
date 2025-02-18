import type { Access } from 'payload';

import {
  getUserTenantIDs,
  hasRole,
  parseCookies
} from '@codeware/app-cms/util/functions';
import type { Tenant } from '@codeware/shared/util/payload-types';

export const canReadTenant: Access<Tenant> = (args) => {
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
      };
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
