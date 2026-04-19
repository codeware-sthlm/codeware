import type { Post } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs, Where } from 'payload';

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
  // Mirror the same pattern as getPage/getPost: override access in draft mode to bypass
  // the _status filter, and add explicit tenant scoping to preserve tenant isolation.
  const overrideAccess = draft === true || payload.authenticatedUser === null;
  const tenantWhere: Where | undefined =
    draft && tenantConfig
      ? { tenant: { equals: tenantConfig.tenant.id } }
      : undefined;
  const scopedWhere: Where | undefined = tenantWhere
    ? { and: [...(where ? [where] : []), tenantWhere] }
    : where;

  const result = await payload.find({
    collection: 'posts',
    where: scopedWhere,
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
