import type { CollectionSlug } from '@codeware/shared/util/payload-types';

import type { RequestOptions } from './types';

/**
 * Get the depth for a collection's GET request.
 *
 * Depth defaults to 2.
 *
 * @param collection - The collection to get the depth for.
 * @param options - The options to get the depth for.
 * @returns The depth for the collection or `null` when not applicable.
 */
export const getDepth = (
  collection: CollectionSlug,
  options: RequestOptions
) => {
  if (options.method !== 'GET') {
    return null;
  }

  // Custom depth for collections
  switch (collection) {
    case 'site-settings':
      // Landing page cards could have links with reference to other collections
      // for which we need the slug to be resolved
      return 3;
    default:
      return 2;
  }
};
