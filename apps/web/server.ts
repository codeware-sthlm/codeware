import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import type { ServerBuild } from '@remix-run/node';
import { Hono } from 'hono';
import { remix } from 'remix-hono/handler';

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
      mode: process.env.NODE_ENV as 'development' | 'production'
    })
  );

serve(
  {
    fetch: app.fetch,
    port: 3001
  },
  (info) => {
    console.log(`Running in ${process.env.NODE_ENV} mode`);
    console.log(`App listening on http://localhost:${info.port}`);
  }
);
