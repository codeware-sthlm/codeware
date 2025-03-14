import { generateCookie, getCookieExpiration } from 'payload';

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
 */
export const generateTenantCookie = ({
  cookiePrefix,
  domain,
  tenantId
}: {
  cookiePrefix: string;
  domain?: string;
  tenantId: string | number;
}) =>
  generateCookie({
    name: `${cookiePrefix}-tenant`,
    expires: getCookieExpiration({ seconds: 7200 }),
    domain,
    value: String(tenantId),
    httpOnly: true,
    // Must be set when sameSite is 'None' and requires HTTPS (except for localhost)
    secure: true,
    // Allows cross-site requests
    sameSite: 'None',
    path: '/',
    returnCookieAsObject: false
  }) as string;
