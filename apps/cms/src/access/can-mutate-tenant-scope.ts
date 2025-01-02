import type { Access } from 'payload/types';

import { getId } from '../utils/get-id';
import { hasRole } from '../utils/has-role';
import { resolveTenant } from '../utils/resolve-tenant';

/**
 * Access control that allows access to mutate tenant scoped collections.
 *
 * - System users can always mutate
 * - Admins for the scoped tenant can mutate
 * - Mutations are not allowed for API requests
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
    // System users can mutate pages for any tenant
    if (hasRole(authUser, 'system-user')) {
      payload.logger.debug('Allow mutation: System user');
      return true;
    }

    // TODO: simplify this logic?
    const canMutate =
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
      }, false) || false;

    if (!canMutate) {
      payload.logger.info(
        `Deny mutation: User #${authUser.id} is not admin for tenant #${tenantID}`
      );
    }
    return canMutate;
  }

  payload.logger.info('Deny mutation: API request mutations are not allowed');

  return false;
};
