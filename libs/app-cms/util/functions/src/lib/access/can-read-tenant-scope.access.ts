import type { Access, Where } from 'payload';

import { getUserTenantIDs } from '../get-user-tenant-ids';
import { hasRole } from '../has-role';
import { resolveTenant } from '../resolve-tenant';

/**
 * Access control that allows access to read tenant scoped collections.
 *
 * Permission can be scoped to a tenant via a cookie for the admin UI
 * or the host header for an API request.
 *
 * Applies to all collections that have a `tenant` field.
 *
 * Special case: when reading a static file, allow access.
 */
export const canReadTenantScopeAccess: Access = async (args) => {
  const {
    isReadingStaticFile,
    req: { headers, payload, user }
  } = args;

  if (isReadingStaticFile) {
    return true;
  }

  const response = await resolveTenant({
    headers,
    payload,
    userOrTenant: user
  });

  // Deny access when no user or tenant is authenticated
  if (!response) {
    return false;
  }

  const { authUser, error, scopedBy, tenantID } = response;

  // Deny access when something went wrong
  if (error) {
    payload.logger.error(error);
    return false;
  }

  // API request: allow access to tenant documents
  if (scopedBy === 'apiRequest') {
    return {
      tenant: {
        equals: tenantID
      }
    } as Where;
  }

  // Admin UI
  const tenantAccessIDs = getUserTenantIDs(authUser);
  const isSystemUser = hasRole(authUser, 'system-user');

  // Scoped to a tenant
  if (tenantID) {
    const hasTenantAccess = tenantAccessIDs.some((id) => id === tenantID);

    // System users and tenant members has access to all tenant documents
    if (isSystemUser || hasTenantAccess) {
      return {
        tenant: {
          equals: tenantID
        }
      } as Where;
    }

    // Other users have no access to documents for the tenant
    return false;
  }

  // No tenant scope

  // System users have access to all documents
  if (isSystemUser) {
    return true;
  }

  // Users have access to their own tenants documents
  if (tenantAccessIDs.length) {
    return {
      tenant: {
        in: tenantAccessIDs
      }
    };
  }

  // Deny access as last resort
  return false;
};
