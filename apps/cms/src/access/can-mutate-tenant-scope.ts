import type { Access } from 'payload/types';

import { getId } from '../utils/get-id';
import { hasRole } from '../utils/has-role';
import { resolveTenant } from '../utils/resolve-tenant';

/**
 * Access control that allows access to mutate tenant scoped collections.
 *
 * Applies to all collections that have a `tenant` field.
 */
export const canMutateTenantScope: Access = async (args) => {
  const {
    req: { headers, payload, user }
  } = args;

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

  // Admin UI: allow mutate access to tenant documents
  if (scopedBy === 'adminUI') {
    // System users can mutate pages for any tenant
    if (hasRole(authUser, 'system-user')) {
      return true;
    }

    // TODO: simplify this logic?
    return (
      authUser.tenants?.reduce((hasAccess: boolean, accessRow) => {
        if (hasAccess) {
          return true;
        }
        if (
          accessRow &&
          getId(accessRow.tenant) === tenantID &&
          accessRow.role === 'admin'
        ) {
          return true;
        }
        return hasAccess;
      }, false) || false
    );
  }

  return false;
};
