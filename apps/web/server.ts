/**
 * This is the entry point for the Node/Hono server aimed for production.
 */

import { randomUUID } from 'crypto';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { ServerBuild } from '@remix-run/node';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { type RemixMiddlewareOptions, remix } from 'remix-hono/handler';

// TODO: Zod types does not get inferred correctly since the schema depends on `@codeware/core/zod`
// Something is different here since it works in the cms project
import env from './env-resolver/env';
import { resolveDevApiKey } from './middlewares/resolve-dev-api-key';

// Load the Remix server build
const build = (await import(
  './build/server/index.js'
)) as unknown as ServerBuild;

const app = new Hono()
  // Serve static files from Remix client build
  .use('*', serveStatic({ root: './build/client' }))
  // Let Remix handle all requests
  .use(
    '*',
    resolveDevApiKey,
    remix({
      build,
      mode: env.NODE_ENV as RemixMiddlewareOptions['mode'],
      getLoadContext: (c) => {
        return {
          ...c.env,
          deviceId: randomUUID(),
          // Special handling in development, otherwise use environment variables
          tenantApiKey: c.get('tenantApiKey') ?? env.PAYLOAD_API_KEY,
          tenantId: c.get('tenantId') ?? env.TENANT_ID
        };
      }
    })
  );

// Disable logger in production
if (env.DEBUG) {
  app.use(logger());
}

serve(
  {
    fetch: app.fetch,
    port: env.PORT as number
  },
  (info) => {
    console.log('🚀 Server ready');
    console.log(
      'Environment:',
      env.DEPLOY_ENV !== 'production' ? env : Object.keys(env)
    );

    console.log(`Running in ${env.NODE_ENV} mode`);
    console.log(`Hono server listening on port ${info.port}`);
  }
);
