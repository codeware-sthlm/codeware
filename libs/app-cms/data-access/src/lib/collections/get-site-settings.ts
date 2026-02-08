import type { Page } from '@codeware/shared/util/payload-types';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QuerySingleOptions } from './types';

type Response = { appName: string; landingPage: Page | null };

/**
 * Fetch site settings with proper access control.
 *
 * Site settings are typically a singleton collection, so this returns
 * the first (and usually only) document.
 *
 * Returns null if settings are not found or the user doesn't have access.
 *
 * Default options:
 * - depth: 3 (higher depth needed for landing page cards)
 *
 * @param payload - Authenticated Payload instance
 * @param options - Query options
 * @returns Site settings or null
 */
export async function getSiteSettings(
  payload: AuthenticatedPayload,
  options: QuerySingleOptions = {}
): Promise<Response | null> {
  const { depth = 3, locale } = options;

  try {
    const result = await payload.find({
      collection: 'site-settings',
      depth,
      locale,
      limit: 1,
      overrideAccess: false,
      user: payload.authenticatedUser
    });

    if (!result.totalDocs) {
      return null;
    }
    const {
      general: { appName, landingPage }
    } = result.docs[0];

    // Ensure proper typing for landingPage
    return {
      appName,
      landingPage: typeof landingPage === 'object' ? landingPage : null
    };
  } catch {
    // Settings not found or access denied
    return null;
  }
}
