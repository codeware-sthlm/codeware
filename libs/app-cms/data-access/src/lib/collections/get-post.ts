import type { Post } from '@codeware/shared/util/payload-types';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single post by slug with proper access control.
 *
 * Returns null if the post is not found or the user doesn't have access.
 *
 * Default options:
 * - depth: 2
 *
 * @param payload - Authenticated Payload instance
 * @param slug - Slug of the post to fetch
 * @param options - Optional query options
 * @returns Post document or null
 */
export async function getPost(
  payload: AuthenticatedPayload,
  slug: string,
  options: QuerySingleOptions = {}
): Promise<Post | null> {
  const { depth = 2, locale } = options;

  try {
    const result = await payload.find({
      collection: 'posts',
      where: {
        slug: { equals: slug }
      },
      depth,
      locale,
      limit: 1,
      overrideAccess: false,
      user: payload.authenticatedUser
    });

    return result.totalDocs ? result.docs[0] : null;
  } catch {
    // Post not found or access denied
    return null;
  }
}
