/**
 * This is the entry point for the Node/Hono server aimed for production.
 */

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { type RemixMiddlewareOptions, remix } from 'remix-hono/handler';

// TODO: Zod types does not get inferred correctly since the schema depends on `@codeware/core/zod`
// Something is different here since it works in the cms project
import type { AppLoadContext } from './app/utils/types';
import env from './env-resolver/env';
import { debugHeadersMiddleware } from './middlewares/debug-headers';
import { resolveAppLoadContextMiddleware } from './middlewares/resolve-app-load-context.js';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

// Load the Remix server build
const build = (await import(
  './build/server/index.js'
)) as unknown as RemixMiddlewareOptions['build'];

const app = new Hono()
  // Serve static files from Remix client build
  .use('*', serveStatic({ root: './build/client' }))
  // Let Remix handle all requests
  .use(
    '*',
    logger(env.DEBUG ? undefined : noop),
    debugHeadersMiddleware,
    resolveAppLoadContextMiddleware,
    remix({
      build,
      mode: env.NODE_ENV as RemixMiddlewareOptions['mode'],
      getLoadContext: (c) => {
        const ctx = {
          deviceId: c.get('deviceId'),
          fallbackLocale: c.get('fallbackLocale'),
          tenantApiKey: c.get('tenantApiKey'),
          tenantId: c.get('tenantId'),
          tenantConfig: c.get('tenantConfig')
        } satisfies AppLoadContext;

        return ctx;
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
    console.log(
      'Environment:',
      env.DEPLOY_ENV !== 'production' ? env : Object.keys(env)
    );

    console.log(`Running in ${env.NODE_ENV} mode`);
    console.log(`Hono server listening on port ${info.port}`);
  }
);
