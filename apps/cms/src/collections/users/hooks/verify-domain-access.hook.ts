import type { CollectionAfterLoginHook } from 'payload';

import { getDomains, hasRole } from '@codeware/app-cms/util/misc';
import type { User } from '@codeware/shared/util/payload-types';

/**
 * Verify that the user is accessing from an allowed domain.
 *
 * This hook runs after login authentication but before the session is created.
 *
 * It checks the tenant defined CMS domains and restricts access to only those domains.
 * When no domains are configured for the user's tenants, access is denied.
 *
 * - System users bypass this check
 * - Users without tenants bypass this check
 *
 * **Use Cases:**
 * - Prevent cross-tenant access via URL manipulation
 * - Support custom branded domains per tenant
 * - Enforce tenant isolation at the domain level
 *
 * @throws Error with 403 status if user tries to access from unauthorized domain
 */
export const verifyDomainAccessHook: CollectionAfterLoginHook<User> = async ({
  req: { headers, payload },
  user
}) => {
  // Skip check for system users - they can access from any domain
  if (hasRole(user, 'system-user')) {
    return user;
  }

  // Skip check for users without tenants (shouldn't happen, but safe fallback)
  if (!user.tenants?.length) {
    return user;
  }

  // Get the request host
  const host = headers.get('host');
  if (!host) {
    // If we can't determine the host, allow access (failsafe)
    payload.logger.warn(
      '[verifyDomainAccess] Could not determine request host, skipping domain check'
    );
    return user;
  }

  // Fetch tenant details to get domains
  const userTenants = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 2,
    select: { tenants: true }
  });

  // Collect all CMS domains from user's tenants
  const allowedCmsDomains = getDomains(userTenants.tenants ?? [], ['cms']);

  // If no domains are configured, allow access (feature is opt-in)
  if (!allowedCmsDomains.length) {
    // payload.logger.info(
    //   `[verifyDomainAccess] No CMS domains configured for user '${user.email}', skipping domain check`
    // );
    // return user;
    payload.logger.warn(
      `[verifyDomainAccess] No CMS domains configured for user '${user.email}'. Please configure at least one CMS domain for proper access control.`
    );
    // Throw error with 403 status
    const error: Error & { status?: number } = new Error(
      `Access denied. No CMS domains are configured for your tenants. Please contact your administrator to configure at least one CMS domain for proper access control.`
    );
    error.status = 403;
    throw error;
  }

  // Check if current host matches any allowed domain
  const isAllowed = allowedCmsDomains.some((domain) => domain === host);

  if (!isAllowed) {
    payload.logger.warn(
      `[verifyDomainAccess] User '${user.email}' attempted login from unauthorized domain '${host}'. Allowed domains: ${allowedCmsDomains.join(', ')}`
    );

    // Throw error with 403 status
    const error: Error & { status?: number } = new Error(
      `Access denied. This workspace is not accessible from this domain. Please use one of: ${allowedCmsDomains.join(', ')}`
    );
    error.status = 403;
    throw error;
  }

  // Access granted
  payload.logger.info(
    `[verifyDomainAccess] User '${user.email}' logged in from authorized domain '${host}'`
  );

  return user;
};
