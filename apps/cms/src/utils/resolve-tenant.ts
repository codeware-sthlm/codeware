import type { IncomingHttpHeaders } from 'http';

import { isUser, parseCookies } from '@codeware/app-cms/util/functions';
import type { Tenant, User } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

import env from '../env-resolver/resolved-env';

/**
 * Response is `undefined` when no user or tenant is authenticated.
 */
type Response =
  | {
      /** Authenticated user with proper collection type */
      authUser: Tenant;
      /** Error message should be handled as an exception */
      error: string | undefined;
      /** In what scope the tenant was resolved */
      scopedBy: 'apiRequest';
      /** Resolved tenant ID */
      tenantID: number;
    }
  | {
      authUser: User;
      error: string | undefined;
      scopedBy: 'adminUI';
      tenantID: number | undefined;
    }
  | undefined;

/**
 * Resolve the tenant which can be scoped via a cookie for the admin UI
 * or the host header for an API request.
 *
 * **Admin UI**
 *
 * User must be logged in and the tenant is found in `payload-tenant` cookie.
 *
 * **API Request**
 *
 * A web client set `Authorization` header including the tenant api key, like:
 *
 * ```
 * Authorization: tenants API-Key 716b25b5-37de-4410-abdf-acd18f864e63
 * ```
 *
 * Using 'tenants' is a Payload convention to identify the api key collection.
 * When the api key match a tenant, Payload will automatically resolve the tenant
 * and assign it to the `user` object.
 *
 * The `Host` header is used to verify that the request also comes from a valid tenant domain.
 *
 * _Special case_
 *
 * For **development**, the host is read from the `X-Tenant-Host` header instead.
 *
 * @param headers - The request headers
 * @param payload - The Payload instance
 * @param userOrTenant - The user or tenant bject
 * @returns The tenant details or undefined when no user or tenant is authenticated
 */

export const resolveTenant = async (args: {
  headers: IncomingHttpHeaders;
  payload: Payload;
  userOrTenant: User | Tenant | null;
}): Promise<Response> => {
  const { headers, payload, userOrTenant } = args;

  if (!userOrTenant) {
    return undefined;
  }

  // Look for the cookie when a user is logged into the admin UI
  if (isUser(userOrTenant)) {
    const cookieName = `${payload.config.cookiePrefix}-tenant`;
    const cookieTenant = parseCookies(headers)[cookieName];
    // A cookie is not always required (system-user)
    return {
      authUser: userOrTenant,
      error: undefined,
      scopedBy: 'adminUI',
      tenantID: cookieTenant ? Number(cookieTenant) : undefined
    };
  }

  // TODO: How or should we handle domain verification?
  // Verify the host header is no guarantee for the tenant domain
  // as the host can be spoofed by the client.
  const { id: tenantID, domains } = userOrTenant;

  // Look for the host header in the api request.
  // Guard 'x-tenant-host' to development only!
  // const host =
  //   (env.DEPLOY_ENV === 'development' ? headers['x-tenant-host'] : '') ||
  //   headers['host'];

  // if (!host) {
  //   return {
  //     authUser: userOrTenant,
  //     error: 'No host header found',
  //     scopedBy: 'apiRequest',
  //     tenantID
  //   };
  // }

  // Verify the host is a valid domain for the tenant
  // TODO: It's not possible due to Fly proxy replace client host with cms api host
  // !! We must find another way !!
  // if (!domains?.some((d) => d.domain === host)) {
  //   return {
  //     authUser: userOrTenant,
  //     error: `Domain '${host}' is not allowed for tenant '${tenantID}'`,
  //     scopedBy: 'apiRequest',
  //     tenantID
  //   };
  // }

  return {
    authUser: userOrTenant,
    error: undefined,
    scopedBy: 'apiRequest',
    tenantID
  };
};
