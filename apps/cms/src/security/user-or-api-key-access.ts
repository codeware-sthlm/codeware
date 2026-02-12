import type { Access } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { isUser } from '@codeware/app-cms/util/misc';
import { verifySignature } from '@codeware/shared/util/signature';

/**
 * Collection access control supporting both user access and
 * tenant API key access with conditional signature verification.
 *
 * Ensures authenticated user or a tenant via API key.
 * When a tenant is detected, access is restricted to the tenant scope.
 *
 * Use this read access control for all tenant enabled collections.
 *
 * **Normal users**
 *
 * Allows access when authenticated.
 *
 * **Tenant users**
 *
 * Besides requiring authentication, additionally verifies request signature based on:
 *
 * - `APP_TYPE=platform`: Signature verification is **enabled** for external requests (CMS host)
 *   - External REST API requests (with HTTP headers): Signature verified
 *   - Internal Local API operations (minimal headers): Skip verification
 * - `APP_TYPE=tenant`: Signature verification is **disabled** (Next.js internal client)
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
export const userOrApiKeyAccess = (): Access => (args) => {
  const {
    req: { headers, payload, user }
  } = args;

  // Restrict to authenticated users only
  if (!user) {
    return false;
  }

  // Allow access for normal users
  if (isUser(user)) {
    return true;
  }

  // For tenant users, verify signature if app type is platform (headless CMS host)
  const { APP_TYPE, SIGNATURE_SECRET } = getEnv();

  if (APP_TYPE === 'platform') {
    if (!SIGNATURE_SECRET) {
      payload.logger.error(
        `Denied, missing signature secret for ${user.slug} tenant`
      );
      return false;
    }

    // Detect if this is an external REST API request vs internal Local API operation
    const isExternalRequest = headers.has('host');

    // Only verify signature for external REST API requests
    if (isExternalRequest) {
      const { success, error } = verifySignature({
        headers,
        secret: SIGNATURE_SECRET
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
