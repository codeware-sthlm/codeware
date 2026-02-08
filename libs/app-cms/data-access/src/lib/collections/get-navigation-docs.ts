import type { Navigation } from '@codeware/shared/util/payload-types';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QueryMultipleOptions } from './types';

/**
 * Use case?
 *
 * Fetch navigation documents with proper access control.
 *
 * Use this when you need the full Payload document structure
 * instead of the transformed navigation tree.
 *
 * Navigation is typically a singleton collection, so this returns
 * the first (and usually only) document, holding the navigation data.
 *
 * Return `null` when no documents were found or access is denied.
 *
 * Default options:
 * - depth: 2
 *
 * @param payload - Authenticated Payload instance
 * @param options - Optional query parameters
 * @returns Navigation document or null
 */
export async function getNavigationDocs(
  payload: AuthenticatedPayload,
  options: Pick<QueryMultipleOptions<'navigation'>, 'depth' | 'locale'> = {}
): Promise<Navigation | null> {
  const { depth = 2, locale } = options;

  try {
    const result = await payload.find({
      collection: 'navigation',
      depth,
      locale,
      limit: 1,
      overrideAccess: false,
      user: payload.authenticatedUser
    });

    return result.totalDocs ? result.docs[0] : null;
  } catch {
    // Access denied
    return null;
  }
}
