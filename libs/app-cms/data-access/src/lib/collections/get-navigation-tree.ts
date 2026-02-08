import {
  type NavigationItem,
  resolveNavigationTree
} from '@codeware/shared/util/payload-api';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch navigation tree with proper access control.
 *
 * Returns an empty array when access is denied.
 *
 * @param payload - Authenticated Payload instance
 * @param options - Optional query parameters
 * @returns Transformed navigation tree ready for rendering
 */
export async function getNavigationTree(
  payload: AuthenticatedPayload,
  options: Pick<QueryMultipleOptions<'navigation'>, 'locale'> = {}
): Promise<NavigationItem[]> {
  const { locale } = options;

  try {
    const result = await payload.find({
      collection: 'navigation',
      depth: 2,
      locale,
      limit: 1,
      overrideAccess: false,
      user: payload.authenticatedUser
    });

    // Transform to UI-ready format
    return resolveNavigationTree(result.docs);
  } catch {
    // Access is denied
    return [];
  }
}
