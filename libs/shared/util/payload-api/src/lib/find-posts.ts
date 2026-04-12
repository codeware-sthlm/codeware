import type { Post } from '@codeware/shared/util/payload-types';

import { invokeRequest } from './utils/invoke-request';
import type { RequestBaseOptions } from './utils/types';

/**
 * Find posts sorted by creation date descending.
 *
 * @param options - The options to find posts with.
 * @param options.limit - Maximum number of posts to return.
 * @returns The list of posts.
 * @throws A formatted error message when the request fails.
 */
export const findPosts = async (
  options: RequestBaseOptions & { limit?: number }
): Promise<Array<Post>> => {
  const { limit, ...baseOptions } = options;

  const response = await invokeRequest('posts', {
    ...baseOptions,
    method: 'GET',
    query: 'sort=-createdAt',
    limit
  });

  if ('error' in response) {
    throw new Error(`Error fetching posts: ${response.error}`);
  }

  return (response.data as Array<Post>) ?? [];
};
