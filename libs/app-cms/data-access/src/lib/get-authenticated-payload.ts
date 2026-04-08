import { headers } from 'next/headers';
import { type SanitizedConfig, getPayload } from 'payload';

import { getTenantContext } from './get-tenant-context';
import { AuthenticatedPayload } from './payload-runtime.types';

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

  // Fallback to admin session (host mode or unauthenticated)
  const authResult = await payload.auth({ headers: headersList });
  return Object.assign(payload, { authenticatedUser: authResult.user });
}
