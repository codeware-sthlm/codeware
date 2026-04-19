import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Disable Next.js draft mode.
 *
 * Query params:
 * - `redirect` — the path to navigate to after exiting draft mode (defaults to '/')
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawRedirectTo = requestUrl.searchParams.get('redirect') ?? '/';

  // Only allow same-origin paths to prevent open-redirect attacks.
  // Scheme-relative URLs like //evil.com pass startsWith('/') but resolve externally.
  const resolved = new URL(rawRedirectTo, requestUrl);
  const redirectTo =
    resolved.origin === requestUrl.origin ? rawRedirectTo : '/';

  const draft = await draftMode();
  draft.disable();

  redirect(redirectTo);
}
