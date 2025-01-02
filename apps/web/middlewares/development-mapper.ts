import { createMiddleware } from 'hono/factory';

import env from '../env-resolver/env';

// TODO: Get from cms development data
const TENANT_MAP = {
  'web-one': { apiKey: 'e6ce9cb9-773a-484b-a388-7ff31bab85a4' },
  'web-two': { apiKey: '716b25b5-37de-4410-abdf-acd18f864e63' }
};

/**
 * Development middleware to set the envronment variables
 * that normally are provided by Infisical based on `TENANT_ID`.
 *
 * The tenant is instead provided by the `X-Dev-Host` header,
 * which is set by the multi-tenant Nginx proxy.
 */
export const developmentMapper = createMiddleware<{
  Variables: {
    tenantApiKey: string;
    tenantId: string;
  };
}>(async (c, next) => {
  if (env.DEPLOY_ENV !== 'development') {
    await next();
    return;
  }

  // Get the multi-tenant host from the nginx proxy
  const host = c.req.header('X-Dev-Host');

  if (!host) {
    return c.text(
      `Header 'X-Dev-Host' is required in development to simulate multi-tenancy`,
      400
    );
  }

  // Extract tenant from host
  const tenantId = host.split('.')[0];
  console.log(`Resolve development tenant '${tenantId}'`);

  // Set variables for the tenant and app
  const tenantApiKey = TENANT_MAP[tenantId].apiKey;

  // Set tenant API key in context for use in handlers
  c.set('tenantApiKey', tenantApiKey);
  c.set('tenantId', tenantId);

  await next();
});
