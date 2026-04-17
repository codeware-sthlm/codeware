import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Disable Next.js draft mode.
 *
 * Query params:
 * - `redirect` — the path to navigate to after exiting draft mode (defaults to '/')
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect') ?? '/';

  // Only allow relative paths to prevent open-redirect attacks
  if (!redirectTo.startsWith('/')) {
    redirect('/');
  }

  const draft = await draftMode();
  draft.disable();

  redirect(redirectTo);
}
