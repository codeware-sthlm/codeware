import { resolveTenantFromHost } from '@codeware/shared/data-access/seed';
import { createMiddleware } from 'hono/factory';

import env from '../env-resolver/env';

/**
 * **ACTIVE IN DEVELOPMENT ONLY**
 *
 * Resolve the tenant API key from the `X-Dev-Host` header,
 * which is set by the multi-tenant Nginx proxy.
 *
 * Host and API key are resolved from development seed data.
 *
 * The tenant API key is then set in the context for use in handlers.
 */
export const resolveDevApiKey = createMiddleware<{
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

  try {
    const { apiKey } = await resolveTenantFromHost(env.DEPLOY_ENV, host);
    // Set tenant API key in context for use in handlers
    c.set('tenantApiKey', apiKey);
  } catch (error) {
    console.error('Error resolving tenant from host\n', error);
    console.log(
      `Error: No tenant found for host '${host}', unable to set tenant API key`
    );
  }

  await next();
});
