import type { CollectionSlug } from '@codeware/shared/util/payload-types';

import { type RequestOptions, invokeRequest } from './invoke-request';

/**
 * Get documents shallow from a collection.
 *
 * @param collection - The collection to get.
 * @param options - The options to get the collection with.
 * @returns The collection documents.
 * @throws An error when the request fails.
 */
export const getShallow = async <T extends CollectionSlug>(
  collection: T,
  options: RequestOptions
) => {
  const response = await invokeRequest(collection, {
    ...options,
    depth: 0,
    limit: 100
  });

  if ('error' in response) {
    throw new Error(
      `Error fetching shallow from '${collection}': ${response.error}`
    );
  }

  return response.data ?? [];
};
