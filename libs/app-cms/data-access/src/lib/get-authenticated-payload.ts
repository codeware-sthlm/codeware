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
 * This function is designed for use on site/front-end pages only.
 * Admin pages are handled by Payload's built-in UI and do not use this function.
 *
 * Authentication strategy:
 * - **Tenant mode**: Use tenant API key authentication
 * - Otherwise just passthrough the payload instance
 *
 * Property `authenticatedUser` will be populated if tenant authentication is successful, otherwise it will be `undefined`.
 *
 * @returns Authenticated Payload instance with user context
 */
export async function getAuthenticatedPayload(
  payloadConfig: SanitizedConfig
): Promise<AuthenticatedPayload> {
  const payload = await getPayload({ config: payloadConfig });
  const headersList = await headers();

  // Check if we have tenant context for API key authentication
  const tenantContext = await getTenantContext();

  if (tenantContext) {
    // Use tenant API key authentication
    // This ensures content is scoped to the correct tenant
    const authHeaders = new Headers();
    authHeaders.set(
      'Authorization',
      `tenants API-Key ${tenantContext.tenantApiKey}`
    );

    const authResult = await payload.auth({ headers: authHeaders });
    if (authResult.user) {
      return Object.assign(payload, { authenticatedUser: authResult.user });
    }
  }

  // Fallback to admin session (platform mode or unauthenticated)
  const authResult = await payload.auth({ headers: headersList });
  return Object.assign(payload, { authenticatedUser: authResult.user });
}
