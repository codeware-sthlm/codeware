import type {
  NavigationDoc,
  PageMeta,
  PostMeta,
  SiteSetting
} from '@codeware/shared/util/payload-types';

/**
 * Resolve the meta for a navigation document or the landing page from site settings.
 *
 * @param data - The navigation document or site settings to resolve the meta for.
 * @returns Page or post meta or `null` if the meta data is not found.
 */
export const resolveMeta = (
  data: NavigationDoc | SiteSetting | null | undefined
): PageMeta | PostMeta | null => {
  if (!data) {
    return null;
  }

  // Resolve site settings landing page meta
  if ('general' in data) {
    const { landingPage } = data.general;
    if (typeof landingPage === 'object') {
      const { description, image, title } = landingPage.meta ?? {};
      return {
        description: description ?? undefined,
        image: (typeof image === 'object' ? image : undefined) ?? undefined,
        title: title ?? undefined
      };
    }
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

  return null;
};
