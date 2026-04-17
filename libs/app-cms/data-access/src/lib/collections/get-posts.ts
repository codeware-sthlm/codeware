import type { Post } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple posts.
 *
 * Default options:
 * - depth: 2
 * - limit: 20
 * - sort: '-createdAt'
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param options - Query options for filtering, sorting, and pagination
 * @returns Object containing posts array and pagination metadata
 */
export async function getPosts(
  runtime: PayloadRuntime,
  options: QueryMultipleOptions<'posts'> = {}
): Promise<PaginatedDocs<Post> | null> {
  const { payload, tenantConfig } = runtime;
  const {
    depth = 2,
    draft,
    limit = 20,
    locale,
    where,
    sort = '-createdAt'
  } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'posts',
    where,
    depth,
    draft,
    locale: locale ?? tenantConfig?.locale,
    limit,
    sort,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result;
}
