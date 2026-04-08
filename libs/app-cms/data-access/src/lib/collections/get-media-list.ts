import type { Media } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple media items.
 *
 * Default options:
 * - depth: 1
 * - limit: 50
 * - sort: '-createdAt'
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param options - Query options for filtering, sorting, and pagination
 * @returns Object containing media array and metadata
 */
export async function getMediaList(
  runtime: PayloadRuntime,
  options: QueryMultipleOptions<'media'> = {}
): Promise<PaginatedDocs<Media> | null> {
  const { payload, tenantConfig } = runtime;
  const { depth = 1, limit = 50, locale, where, sort = '-createdAt' } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'media',
    where,
    depth,
    locale: locale ?? tenantConfig?.locale,
    limit,
    sort,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result;
}
