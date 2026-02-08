import { Category } from '@codeware/shared/util/payload-types';
import { PaginatedDocs } from 'payload';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple categories with proper access control.
 *
 * Returns `null` when access is denied.
 *
 * Default options:
 * - depth: 2
 * - limit: 100
 * - sort: 'name'
 *
 * @param payload - Authenticated Payload instance
 * @param options - Optional query options
 * @returns Object containing categories and metadata
 */
export async function getCategories(
  payload: AuthenticatedPayload,
  options: QueryMultipleOptions<'categories'> = {}
): Promise<PaginatedDocs<Category> | null> {
  const { depth = 2, locale, limit = 100, where, sort = 'name' } = options;

  try {
    const result = await payload.find({
      collection: 'categories',
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
