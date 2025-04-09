import type { CardGroupLink } from '@codeware/shared/util/payload-types';

/**
 * Extract link details from a Link field object.
 *
 * It can be useful in a component that should render a link.
 *
 * @param link - The Link field object to extract data from.
 * @returns Link details or `null` if link is not active.
 */
export const extractLink = (
  link?: CardGroupLink
):
  | {
      label: string;
      navTrigger: Extract<CardGroupLink['navTrigger'], 'link'>;
      newTab: boolean;
      url: string;
    }
  | {
      navTrigger: Extract<CardGroupLink['navTrigger'], 'card'>;
      newTab: boolean;
      url: string;
    }
  | null => {
  if (!link) {
    return null;
  }

  const { label, navTrigger, newTab, reference, type: linkType, url } = link;

  // Type safe properties to have the expected types for a valid link
  if (typeof navTrigger !== 'string' || typeof linkType !== 'string') {
    return null;
  }

  // By design a value will be applied before returning the extracted link
  let linkUrl = '';

  switch (linkType) {
    case 'reference':
      {
        // Type safe value as collection object is expected to have a slug
        if (typeof reference?.value !== 'object' || !reference.value.slug) {
          console.error('Invalid reference link, expected a slug', reference);
          return null;
        }
        const {
          relationTo,
          value: { slug }
        } = reference;

        linkUrl = relationTo === 'pages' ? slug : `${relationTo}/${slug}`;
      }
      break;
    case 'custom':
      if (!url) {
        console.error('Invalid custom link, expected a URL');
        return null;
      }
      linkUrl = url;
      break;
    default:
      throw new Error(`Invalid link type: ${linkType}`);
  }

  if (!linkUrl) {
    console.error('Invalid link, expected a URL');
    return null;
  }

  return navTrigger === 'card'
    ? {
        navTrigger,
        newTab: newTab ?? false,
        url: linkUrl
      }
    : {
        // Label is required for link trigger
        label: String(label),
        navTrigger,
        newTab: newTab ?? false,
        url: linkUrl
      };
};
