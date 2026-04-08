import type { TenantRuntimeConfig } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

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
 * Runtime context for Payload operations, including the authenticated Payload instance and tenant configuration.
 * This context is used in server-side operations to ensure that all Payload interactions are properly authenticated and scoped to the correct tenant.
 *
 * `tenantConfig` will be `null` if there is no tenant context or the configuration could not be loaded.
 */
export type PayloadRuntime = {
  payload: AuthenticatedPayload;
  tenantConfig: TenantRuntimeConfig | null;
};
