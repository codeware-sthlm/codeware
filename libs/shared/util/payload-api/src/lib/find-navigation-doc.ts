import type {
  NavigationReferenceCollection,
  Page,
  Post
} from '@codeware/shared/util/payload-types';

import { invokeRequest } from './utils/invoke-request';
import type { NavigationDoc, RequestBaseOptions } from './utils/types';

/**
 * Find a navigation document by the URL collection and slug parameters.
 *
 * @param collection - The collection to find the document in (default: `pages`).
 * @param slug - The slug of the document to find in the collection.
 * @param options - The options to find the document with.
 * @returns The document for the slug or `null` if the document is not found.
 * @throws A formatted error message when the request fails.
 */
export const findNavigationDoc = async (
  collection: NavigationReferenceCollection | string | undefined,
  slug: string,
  options: RequestBaseOptions
): Promise<NavigationDoc | null> => {
  // Default to pages if not provided
  const lookupCollection = (collection ||
    'pages') as NavigationReferenceCollection;

  const response = await invokeRequest(lookupCollection, {
    ...options,
    method: 'GET',
    query: `where[slug][equals]=${slug}`
  });

  if ('error' in response) {
    throw new Error(
      `Error fetching '${slug}' from '${lookupCollection}': ${response.error}`
    );
  }

  const data = response.data?.[0];

  if (data && lookupCollection === 'pages') {
    const page = data as Page;
    return {
      collection: lookupCollection,
      header: page.header,
      layout: page.layout,
      name: page.name
    };
  }

  if (data && lookupCollection === 'posts') {
    const post = data as Post;
    return {
      collection: lookupCollection,
      content: post.content,
      heroImage:
        typeof post.heroImage === 'object' ? post.heroImage : undefined,
      title: post.title
    };
  }

  return null;
};
