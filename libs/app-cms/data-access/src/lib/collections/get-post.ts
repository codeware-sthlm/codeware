import type { Post } from '@codeware/shared/util/payload-types';
import type { BasePayload, Where } from 'payload';

import { mapToRuntime } from '../map-to-runtime';
import type { PayloadRuntime } from '../payload-runtime.types';

import { resolveDraftQuery } from './resolve-draft-query';
import type { QuerySingleOptions } from './types';

/**
 * Fetch a single post by slug.
 *
 * Returns null if the post is not found or the user doesn't have access.
 *
 * Default options:
 * - depth: 2
 *
 * Set `draft: true` to fetch the newest version (including unpublished
 * drafts). Access and tenant scoping in draft mode are handled by
 * `resolveDraftQuery`.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param slugOrId - Slug or ID of the post to fetch
 * @param options - Optional query options
 * @returns Post document or null
 */
export async function getPost(
  runtime: PayloadRuntime | BasePayload,
  slugOrId: number | string,
  options: QuerySingleOptions = {}
): Promise<Post | null> {
  const resolvedRuntime = mapToRuntime(runtime);
  const { payload, tenantConfig } = resolvedRuntime;
  const { depth = 2, draft, locale } = options;

  const idWhere: Where =
    typeof slugOrId === 'number'
      ? { id: { equals: slugOrId } }
      : { slug: { equals: slugOrId } };
  const { overrideAccess, where } = resolveDraftQuery(
    resolvedRuntime,
    draft,
    idWhere
  );

  const result = await payload.find({
    collection: 'posts',
    where,
    depth,
    draft,
    locale: locale ?? tenantConfig?.locale,
    limit: 1,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result.totalDocs ? result.docs[0] : null;
}
