import type { Access } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { isUser } from '@codeware/app-cms/util/misc';
import { verifySignature } from '@codeware/shared/util/signature';

import { resolveScopedTenant } from './resolve-scoped-tenant';

/**
 * Collection access control supporting both user access and
 * tenant API key access with conditional signature verification.
 *
 * Ensures authenticated user or a tenant via API key.
 * When a tenant is detected, access is restricted to the tenant scope.
 *
 * Use this read access control for all tenant enabled collections.
 *
 * **Normal users in tenant mode**
 *
 * Returns a WHERE constraint scoped to the active tenant so that users with
 * multi-tenant memberships cannot read content from other tenants while the
 * server is running as a single-tenant deployment. Combined with the
 * multi-tenant plugin's own `{ tenant: { in: userTenantIds } }` constraint
 * the AND intersection naturally limits results to the active tenant only.
 *
 * The active tenant is resolved without React context to stay correct in both
 * RSC (admin UI) and route handler (REST API) invocations:
 * - Non-development: use `APP_MODE.apiKey` directly from env.
 * - Development: resolve the API key from static seed data via `TENANT_ID`.
 *
 * **Normal users in host mode**
 *
 * Allows access when authenticated. The multi-tenant plugin applies its
 * own tenant scoping based on the `payload-tenant` cookie.
 *
 * **Tenant users**
 *
 * Besides requiring authentication, additionally verifies request signature based on:
 *
 * - CMS host mode: Signature verification is **enabled** for external requests
 *   - External REST API requests (with HTTP headers): Signature verified
 *   - Internal Local API operations (minimal headers): Skip verification
 * - Tenant mode: Signature verification is **disabled** (Next.js internal client)
 *
 * **Security Model:**
 *
 * External REST API requests are distinguished from internal Local API operations by checking
 * for the `host` header, which is **required** by the HTTP/1.1 specification (RFC 2616).
 *
 * A malicious client cannot bypass signature verification by omitting the `host` header because:
 *
 * 1. HTTP/1.1 spec mandates the `host` header for all requests
 * 2. HTTP servers (Node.js, nginx, etc.) reject requests without `host` before reaching application code
 * 3. All HTTP clients (browsers, fetch, curl, etc.) automatically include the `host` header
 * 4. Internal Local API calls are direct function invocations within the same process (no HTTP involved)
 *
 * Therefore:
 * - Presence of `host` header → External HTTP request → Signature verification required
 * - Absence of `host` header → Internal Local API call → Trusted, skip verification
 *
 * Returns access filter for the tenant permissions, which will be merged
 * with the multi-tenant plugin's tenant access control.
 *
 * @returns Access control function with user and tenant scope support.
 */
export const userOrApiKeyAccess = (): Access => async (args) => {
  const {
    req: { headers, payload, user }
  } = args;

  // Restrict to authenticated users only
  if (!user) {
    return false;
  }

  const { APP_MODE } = getEnv();

  // Allow access for normal users, scoped to active tenant in tenant mode.
  if (isUser(user)) {
    if (APP_MODE.type === 'tenant') {
      const tenant = await resolveScopedTenant(payload);

      // Ensure the authenticated user docs are also scoped to the resolved tenant
      if (tenant) {
        return { tenant: { equals: tenant.id } };
      }

      // If we can't resolve a tenant, deny access to be safe (shouldn't happen in tenant mode)
      payload.logger.warn(
        '[userOrApiKeyAccess] Could not resolve tenant for tenant-mode user, denying access'
      );
      return false;
    }

    return true;
  }

  // cms host mode
  if (APP_MODE.type === 'host') {
    // Detect if this is an external REST API request vs internal Local API operation
    const isExternalRequest = headers.has('host');

    // Only verify signature for external REST API requests
    if (isExternalRequest) {
      const { success, error } = verifySignature({
        headers,
        secret: APP_MODE.signatureSecret
      });

      if (!success) {
        payload.logger.info(`Tenant denied, invalid signature:\n${error}`);
        return false;
      }
    }
    // Internal Local API operations (no 'host' header) skip signature verification
  }

  // Restrict access to the tenant scope
  return {
    tenant: { equals: user.id }
  };
};
