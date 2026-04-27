import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Maintenance mode — serve maintenance page for all routes except the health
  // endpoint (so Fly health checks pass) and the maintenance page itself
  // (to avoid an infinite rewrite loop).
  if (
    process.env.MAINTENANCE_MODE === 'true' &&
    pathname !== '/api/health' &&
    pathname !== '/maintenance'
  ) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  // Clear Next.js draft mode when the Payload session has expired or been cleared.
  //
  // `/api/preview` enables draft mode (sets `__prerender_bypass`) so Payload's
  // live preview can fetch draft content. Payload's logout only clears its own
  // `payload-token` cookie — the draft cookie persists, causing site pages to
  // keep rendering in draft mode after logout, which produces empty or broken
  // content for unauthenticated visitors.
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/maintenance')
  ) {
    const hasDraftCookie = request.cookies.has('__prerender_bypass');
    const hasPayloadToken = request.cookies.has('payload-token');

    if (hasDraftCookie && !hasPayloadToken) {
      const response = NextResponse.redirect(request.url);
      response.cookies.delete('__prerender_bypass');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude Next.js internals — all other routes including admin and api
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};
