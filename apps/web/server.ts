/**
 * This is the entry point for the Node/Hono server aimed for production.
 */

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { ServerBuild } from '@remix-run/node';
import { Hono } from 'hono';
import { remix } from 'remix-hono/handler';

import env from './env';

// Load the Remix server build
const build = (await import('./build/server/index.js')) as ServerBuild;

const app = new Hono()
  // Serve static files from Remix client build
  .use('*', serveStatic({ root: './build/client' }))
  // Let Remix handle all requests
  .use(
    '*',
    remix({
      build,
      mode: env.NODE_ENV
    })
  );

serve(
  {
    fetch: app.fetch,
    port: env.PORT
  },
  (info) => {
    console.log(`Running in ${env.NODE_ENV} mode`);
    console.log(`Hono server listening on port ${info.port}`);
  }
);
