import type {
  CollectionSlug,
  CollectionWithoutPayload
} from '@codeware/shared/util/payload-types';

import {
  type MethodOptions,
  type RequestBaseOptions,
  invokeRequest
} from './utils/invoke-request';

/**
 * Create a document in a collection.
 *
 * @param collection - The collection to create the document in.
 * @param options - The options to create the document with.
 * @returns The created document or `null` if the document was not created.
 * @throws A formatted error message when the request fails.
 */
export const post = async <T extends CollectionSlug>(
  collection: T,
  options: RequestBaseOptions & MethodOptions<'POST'>
): Promise<CollectionWithoutPayload[T] | null> => {
  const response = await invokeRequest(collection, {
    ...options,
    method: 'POST'
  });

  if ('error' in response) {
    throw new Error(`Error posting to '${collection}': ${response.error}`);
  }

  // TODO: Check the response type when a document is not created for a POST request
  return response.data?.[0] ?? null;
};
