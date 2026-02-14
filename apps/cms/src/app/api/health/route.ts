/**
 * Health check endpoint for Fly.io health checks.
 *
 * Returns 200 OK for both tenant and non-tenant deployments,
 * and prints a simple "Pong!" message in the response body.
 *
 * This endpoint bypasses all authentication and routing logic.
 */
export async function GET() {
  return new Response('Pong!', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
