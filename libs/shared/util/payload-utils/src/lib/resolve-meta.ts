import type {
  NavigationDoc,
  Page,
  PageMeta,
  Post,
  PostMeta,
  Tour,
  TourMeta
} from '@codeware/shared/util/payload-types';

/**
 * Resolve the meta for a navigation document, page, post, or tour.
 *
 * @param data - The navigation document, page, post, or tour to resolve the meta for.
 * @returns Page, post or tour meta or `null` if the meta data is not found.
 */
export const resolveMeta = (
  data: NavigationDoc | Page | Post | Tour | null | undefined
): PageMeta | PostMeta | TourMeta | null => {
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

  // Resolve page, post or tour meta
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
