import type { Media } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple media items with proper access control.
 *
 * Returns `null` if access is denied.
 *
 * Default options:
 * - depth: 1
 * - limit: 50
 * - sort: '-createdAt'
 *
 * @param payload - Authenticated Payload instance
 * @param options - Query options for filtering, sorting, and pagination
 * @returns Object containing media array and metadata
 */
export async function getMediaList(
  payload: AuthenticatedPayload,
  options: QueryMultipleOptions<'media'> = {}
): Promise<PaginatedDocs<Media> | null> {
  const { depth = 1, locale, limit = 50, where, sort = '-createdAt' } = options;

  try {
    const result = await payload.find({
      collection: 'media',
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
