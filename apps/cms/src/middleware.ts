import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Clear Next.js draft mode when the Payload session has expired or been cleared.
 *
 * `/api/preview` enables draft mode (sets `__prerender_bypass`) so Payload's
 * live preview can fetch draft content. Payload's logout only clears its own
 * `payload-token` cookie — the draft cookie persists, causing site pages to
 * keep rendering in draft mode after logout, which produces empty or broken
 * content for unauthenticated visitors.
 */
export function middleware(request: NextRequest) {
  const hasDraftCookie = request.cookies.has('__prerender_bypass');
  const hasPayloadToken = request.cookies.has('payload-token');

  if (hasDraftCookie && !hasPayloadToken) {
    const response = NextResponse.redirect(request.url);
    response.cookies.delete('__prerender_bypass');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply only to site pages — not to admin routes or Next.js internals
    '/((?!admin|api|_next/static|_next/image|favicon.ico).*)'
  ]
};
