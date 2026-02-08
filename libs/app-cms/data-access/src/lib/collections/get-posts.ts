import type { Post } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple posts with proper access control.
 *
 * Returns `null` if access is denied.
 *
 * Default options:
 * - depth: 2
 * - limit: 20
 * - sort: '-createdAt'
 *
 * @param payload - Authenticated Payload instance
 * @param options - Query options for filtering, sorting, and pagination
 * @returns Object containing posts array and pagination metadata
 */
export async function getPosts(
  payload: AuthenticatedPayload,
  options: QueryMultipleOptions<'posts'> = {}
): Promise<PaginatedDocs<Post> | null> {
  const { depth = 2, locale, limit = 20, where, sort = '-createdAt' } = options;

  try {
    const result = await payload.find({
      collection: 'posts',
      where,
      depth,
      locale,
      limit,
      sort,
      overrideAccess: false,
      user: payload.authenticatedUser
    });

    return result;
  } catch {
    // Access denied
    return null;
  }
}
