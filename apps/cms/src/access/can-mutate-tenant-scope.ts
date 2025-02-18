import type { Access } from 'payload';

import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/functions';

import { resolveTenant } from '../utils/resolve-tenant';

/**
 * Access control that allows access to mutate tenant scoped collections.
 *
 * - System users can always mutate
 * - Users for the scoped tenant can mutate
 * - Mutations are not allowed for API requests
 *
 * Applies to all collections that have a `tenant` field.
 *
 * @deprecated Remove when it has no value anymore
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
    payload.logger.debug('Deny mutation: No user or tenant authenticated');
    return false;
  }

  const { authUser, error, scopedBy, tenantID } = response;

  // Deny access when something went wrong
  if (error) {
    payload.logger.debug('Deny mutation: Error resolving tenant', error);
    return false;
  }

  // Admin UI: allow mutate access to tenant documents
  if (scopedBy === 'adminUI') {
    // System users can always mutate
    if (hasRole(authUser, 'system-user')) {
      return true;
    }

    // User must have access to the tenant, role is not checked
    return getUserTenantIDs(authUser).some((id) => id === tenantID);
  }

  payload.logger.info('Deny mutation: API request mutations are not allowed');

  return false;
};
