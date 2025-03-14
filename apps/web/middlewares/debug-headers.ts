import { createMiddleware } from 'hono/factory';

import env from '../env-resolver/env';

/**
 * Hono middleware for debugging request and response headers.
 *
 * Activate by setting `DEBUG` to `true` in the environment variables.
 */
export const debugHeadersMiddleware = createMiddleware(async (c, next) => {
  if (!env.DEBUG) {
    await next();
    return;
  }

  console.log(`[HONO INCOMING] Request ${c.req.method} ${c.req.url}`);
  console.log(
    '[HONO INCOMING] Headers:\n',
    JSON.stringify(c.req.header(), null, 2)
  );

  await next();

  console.log(
    '[HONO OUTGOING] Response headers:\n',
    JSON.stringify(Object.fromEntries(c.res.headers.entries()), null, 2)
  );
});
