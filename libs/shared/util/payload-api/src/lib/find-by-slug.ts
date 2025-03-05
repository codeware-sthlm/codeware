import type { CollectionSlug } from '@codeware/shared/util/payload-types';

import { type RequestOptions, invokeRequest } from './invoke-request';

/**
 * Find a document by the slug field.
 *
 * @param collection - The collection to find the document in.
 * @param slug - The slug of the document to find.
 * @param options - The options to find the document with.
 * @returns The document for the slug or `null` if the document is not found.
 * @throws An error when the request fails.
 */
export const findBySlug = async <T extends CollectionSlug>(
  collection: T,
  slug: string,
  options: RequestOptions
) => {
  const response = await invokeRequest(collection, {
    ...options,
    query: `where[slug][equals]=${slug}`
  });

  if ('error' in response) {
    throw new Error(
      `Error fetching '${slug}' from '${collection}': ${response.error}`
    );
  }

  return response.data?.[0] ?? null;
};
