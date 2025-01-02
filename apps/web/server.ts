/**
 * This is the entry point for the Node/Hono server aimed for production.
 */

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { AppLoadContext, ServerBuild } from '@remix-run/node';
import { Hono } from 'hono';
import { type RemixMiddlewareOptions, remix } from 'remix-hono/handler';

// TODO: Zod types does not get inferred correctly since the schema depends on `@codeware/core/zod`
// Something is different here since it works in the cms project
import env from './env-resolver/env';
import { tenantMiddleware } from './middlewares/tenant';

// Load the Remix server build
const build = (await import(
  './build/server/index.js'
)) as unknown as ServerBuild;

const app = new Hono()
  // Serve static files from Remix client build
  .use('*', serveStatic({ root: './build/client' }))
  // Apply tenant middleware to all api requests
  .use('*', tenantMiddleware)
  // Let Remix handle all requests
  .use(
    '*',
    remix({
      build,
      mode: env.NODE_ENV as RemixMiddlewareOptions['mode'],
      getLoadContext: (c) => {
        const context: AppLoadContext = {
          tenantApiKey: c.get('tenantApiKey'),
          tenantHost: c.get('tenantHost')
        };
        return context;
      }
    })
  );

serve(
  {
    fetch: app.fetch,
    port: env.PORT as number
  },
  (info) => {
    console.log('🚀 Server ready');
    console.log('Environment:', env);

    console.log(`Running in ${env.NODE_ENV} mode`);
    console.log(`Hono server listening on port ${info.port}`);
  }
);
