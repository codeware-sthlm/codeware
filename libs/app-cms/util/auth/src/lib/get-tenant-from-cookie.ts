import { type SanitizedConfig, parseCookies } from 'payload';

/**
 * Get the tenant scope from cookies
 *
 * @param config Sanitized config
 * @param headers Headers from the request
 * @returns Tenant ID or `null` when the tenant could not be found
 */
export const getTenantFromCookie = (
  config: SanitizedConfig,
  headers: Headers
) => {
  const cookies = parseCookies(headers);
  const tenant = cookies.get(`${config.cookiePrefix}-tenant`);

  return tenant || null;
};
