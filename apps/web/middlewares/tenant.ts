import { createMiddleware } from 'hono/factory';

import env from '../env-resolver/env';

// TODO: Get from cms development data
const TENANT_MAP = {
  'web-one.localhost': 'e6ce9cb9-773a-484b-a388-7ff31bab85a4',
  'web-two.localhost': '716b25b5-37de-4410-abdf-acd18f864e63'
};
type TenantHost = keyof typeof TENANT_MAP;

/**
 * Middleware to set tenant API key and host in context:
 * - `tenantApiKey`
 * - `tenantHost`
 *
 * This middleware is only active in **development** to support
 * multi-tenant payload proxy.
 */
export const tenantMiddleware = createMiddleware(async (c, next) => {
  if (env.DEPLOY_ENV !== 'development') {
    return await next();
  }

  // Get hostname from request (e.g. web-one.localhost:4200)
  const host = c.req.header('host');

  if (!host) {
    return c.text('No host header', 400);
  }

  // Extract domain without port
  const domain = host.split(':')[0] as TenantHost;

  // Get API key for tenant
  const apiKey = TENANT_MAP[domain] || 'dev-api-key';

  // Set tenant API key in context for use in handlers
  c.set('tenantApiKey', apiKey);
  c.set('tenantHost', domain);

  await next();
});
