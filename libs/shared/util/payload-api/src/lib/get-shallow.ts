import type {
  CollectionSlug,
  CollectionWithoutPayload
} from '@codeware/shared/util/payload-types';

import { invokeRequest } from './utils/invoke-request';
import type { MethodOptions, RequestBaseOptions } from './utils/types';

/**
 * Get documents shallow (hence depth 0) from a collection.
 *
 * Defaults to a limit of 100 documents.
 *
 * @param collection - The collection to get.
 * @param options - The options to get the collection with.
 * @returns The collection documents.
 * @throws A formatted error message when the request fails.
 */
export const getShallow = async <T extends CollectionSlug>(
  collection: T,
  options: RequestBaseOptions & MethodOptions<'GET'>
): Promise<Array<CollectionWithoutPayload[T]>> => {
  const response = await invokeRequest(collection, {
    ...options,
    method: 'GET',
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
