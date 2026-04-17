import type { Post } from '@codeware/shared/util/payload-types';
import type { BasePayload, Where } from 'payload';

import { mapToRuntime } from '../map-to-runtime';
import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single post by slug.
 *
 * Returns null if the post is not found or the user doesn't have access.
 *
 * Default options:
 * - depth: 2
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
  const { payload, tenantConfig } = mapToRuntime(runtime);
  const { depth = 2, draft, locale } = options;
  // Override access in draft/preview context — draft mode is only enabled after
  // auth validation in /api/preview, so it is safe to bypass the status filter.
  const overrideAccess = payload.authenticatedUser === null || !!draft;

  const where: Where =
    typeof slugOrId === 'number'
      ? { id: { equals: slugOrId } }
      : { slug: { equals: slugOrId } };

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
