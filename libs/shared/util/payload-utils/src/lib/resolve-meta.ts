import type {
  NavigationDoc,
  Page,
  PageMeta,
  Post,
  PostMeta
} from '@codeware/shared/util/payload-types';

/**
 * Resolve the meta for a navigation document, page, or post.
 *
 * @param data - The navigation document, page, or post to resolve the meta for.
 * @returns Page or post meta or `null` if the meta data is not found.
 */
export const resolveMeta = (
  data: NavigationDoc | Page | Post | null | undefined
): PageMeta | PostMeta | null => {
  if (!data) {
    return null;
  }

  // Resolve collection page or post meta
  if ('collection' in data) {
    const { collection } = data;
    switch (collection) {
      case 'pages':
      case 'posts':
        return data.meta;
      default:
        return null;
    }
  }

  // Resolve page meta
  if ('meta' in data) {
    const { description, image, title } = data.meta ?? {};
    return {
      description: description ?? undefined,
      image: (typeof image === 'object' ? image : undefined) ?? undefined,
      title: title ?? undefined
    };
  }

  return null;
};
