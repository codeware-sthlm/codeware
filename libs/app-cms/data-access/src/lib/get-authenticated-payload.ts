import { headers } from 'next/headers';
import { type Payload, SanitizedConfig, getPayload } from 'payload';

import { getTenantContext } from './get-tenant-context';

/**
 * Authenticated Payload wrapper that includes the user context.
 * This type extends Payload with a convenience property to access the authenticated user.
 */
export type AuthenticatedPayload = Payload & {
  /**
   * The authenticated user for this request.
   * Use this user in all Local API calls to ensure proper access control.
   */
  authenticatedUser: Awaited<ReturnType<Payload['auth']>>['user'];
};

/**
 * Get an authenticated Payload instance for the current request.
 *
 * Authentication flow:
 * 1. Try to authenticate with incoming request headers (supports editor sessions via cookies)
 * 2. If not authenticated and tenant context exists, synthesize Authorization header with tenant API key
 *
 * This preserves the multi-tenant auth semantics where a valid tenant API key
 * means the request is authenticated as that tenant (from tenants collection).
 *
 * IMPORTANT: When using the Local API, you MUST:
 * - Set `overrideAccess: false` in all queries
 * - Pass `user: payload.authenticatedUser` in all queries
 * - Filter by tenant when applicable
 *
 * The Local API does NOT automatically apply access control like the REST API does.
 *
 * @returns Authenticated Payload instance with user context
 */
export async function getAuthenticatedPayload(
  payloadConfig: SanitizedConfig
): Promise<AuthenticatedPayload> {
  const payload = await getPayload({ config: payloadConfig });

  // Get incoming request headers
  const headersList = await headers();

  // Try to authenticate with incoming headers (supports cookie-based editor sessions)
  let authResult = await payload.auth({ headers: headersList });

  // If already authenticated (e.g., editor session), return payload
  if (authResult.user) {
    return Object.assign(payload, { authenticatedUser: authResult.user });
  }

  // If not authenticated, check if we have tenant context to fall back to
  const tenantContext = await getTenantContext();

  if (tenantContext) {
    // Synthesize Authorization header with tenant API key
    // This makes Payload treat the request as authenticated with the tenant service user
    const authHeaders = new Headers();
    authHeaders.set(
      'Authorization',
      `tenants API-Key ${tenantContext.tenantApiKey}`
    );

    // Re-authenticate with the tenant API key
    authResult = await payload.auth({ headers: authHeaders });
    if (authResult.user) {
      return Object.assign(payload, { authenticatedUser: authResult.user });
    }
  }

  // Return payload instance with null user (unauthenticated)
  return Object.assign(payload, { authenticatedUser: null });
}
