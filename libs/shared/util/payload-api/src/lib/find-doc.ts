import type {
  DocData,
  RenderableCollection
} from '@codeware/shared/util/payload-utils';

import { findBySlug } from './find-by-slug';
import { getBlocksData } from './get-blocks-data';
import type { RequestBaseOptions } from './utils/types';

type DocFetcher = (
  slug: string,
  options: RequestBaseOptions
) => Promise<DocData | null>;

/**
 * How each renderable collection is fetched.
 *
 * Using a record to make sure all renderable collections are included and not
 * forgotten — a collection turned renderable fails the build here until it has
 * a fetcher.
 */
const fetchers = {
  pages: async (slug, options) => {
    const doc = await findBySlug('pages', slug, options);
    if (!doc) return null;

    return {
      collection: 'pages',
      doc,
      blocksData: await getBlocksData(doc.layout, options)
    };
  },
  posts: async (slug, options) => {
    const doc = await findBySlug('posts', slug, options);

    return doc && { collection: 'posts', doc };
  },
  tours: async (slug, options) => {
    const doc = await findBySlug('tours', slug, options);

    return doc && { collection: 'tours', doc };
  }
} satisfies Record<RenderableCollection, DocFetcher>;

// `hasOwn`, not `in`: the prototype chain would let `/toString/<slug>` past the
// guard and call a non-fetcher
const isRenderable = (collection: string): collection is RenderableCollection =>
  Object.hasOwn(fetchers, collection);

/**
 * Find a renderable document by slug, tagged with the collection it came from.
 *
 * Clients pass the dynamic route values straight through and render the result
 * with `RenderDoc`, so no collection knowledge leaks into the app.
 *
 * @param collection - The collection segment, defaulting to pages when absent.
 * @param slug - The slug of the document to find.
 * @param options - The options to find the document with.
 * @returns The tagged document, or `null` when the collection is not
 * renderable or holds no document for the slug.
 * @throws A formatted error message when the request fails.
 */
export const findDoc = async (
  collection: string | undefined,
  slug: string,
  options: RequestBaseOptions
): Promise<DocData | null> => {
  // The collection segment is optional — a bare slug is a page
  const lookupCollection = collection || 'pages';
  if (!isRenderable(lookupCollection)) return null;

  return fetchers[lookupCollection](slug, options);
};
