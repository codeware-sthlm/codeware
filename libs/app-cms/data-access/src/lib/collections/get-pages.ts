import type { Page } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple pages with proper access control.
 *
 * Returns `null` if access is denied.
 *
 * Default options:
 * - depth: 2
 * - limit: 50
 * - sort: 'name'
 *
 * @param payload - Authenticated Payload instance
 * @param options - Query options for filtering, sorting, and pagination
 * @returns Object containing pages array and pagination metadata
 */
export async function getPages(
  payload: AuthenticatedPayload,
  options: QueryMultipleOptions<'pages'> = {}
): Promise<PaginatedDocs<Page> | null> {
  const { depth = 2, locale, limit = 50, where, sort = 'name' } = options;

  try {
    const result = await payload.find({
      collection: 'pages',
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
