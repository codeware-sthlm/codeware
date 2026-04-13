import { getPayload } from 'payload';

import config from '../../../payload.config';

/**
 * Health check endpoint for Fly.io health checks.
 *
 * Verifies both process liveness and database connectivity.
 * Returns 200 OK with "Pong!" when healthy, 503 when the database
 * is unreachable — allowing Fly's rolling deploy to stall on a
 * broken machine rather than routing traffic to it.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config });
    await payload.db.pool.query('SELECT 1');
    return new Response('Pong!', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch {
    return new Response('DB unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
