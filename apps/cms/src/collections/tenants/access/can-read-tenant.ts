import type { User } from '@codeware/shared/util/payload';
import {
  getTenantAccessIDs,
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

  const tenantAccessIDs = getTenantAccessIDs(user);
  const selectedTenant = parseCookies(headers)[cookieName];
  const systemUser = hasRole(user, 'system-user');

  // Scoped to a tenant via cookie
  if (selectedTenant) {
    const hasTenantAccess = tenantAccessIDs.some(
      (id) => id.toString() === selectedTenant
    );

    // System users and tenant members has access to the tenant
    if (systemUser || hasTenantAccess) {
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

  // System users have access to all tenants
  if (systemUser) {
    return true;
  }

  // Users have access to their own tenants
  if (tenantAccessIDs.length) {
    return {
      id: {
        in: tenantAccessIDs
      }
    };
  }

  // Deny access to all tenants
  return false;
};
