import { resolveTenantSeedFromHost } from '@codeware/shared/util/seed';
import { createMiddleware } from 'hono/factory';

import env from '../env-resolver/env';

/**
 * **ACTIVE IN DEVELOPMENT ONLY**
 *
 * Resolve the tenant API key via the `X-Tenant-Host` header,
 * which is set by the multi-tenant Nginx proxy.
 *
 * Payload API key is resolved from development seed data,
 * and passed to the context for use in handlers.
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
  const host = c.req.header('X-Tenant-Host');

  if (!host) {
    return c.text(
      `Header 'X-Tenant-Host' is required in development to simulate multi-tenancy`,
      400
    );
  }

  // Set tenant API key in context for use in handlers
  const tenant = await resolveTenantSeedFromHost(host);
  if (tenant) {
    c.set('tenantApiKey', tenant.apiKey);
  } else {
    console.log(
      `Error: No tenant found for host '${host}', unable to set tenant API key`
    );
  }

  await next();
});
