import type { CardBlockLink } from '@codeware/shared/util/payload-types';

import { resolveLinkGroup } from './resolve-link-group';

type ResolvedLink =
  | {
      label: string;
      navTrigger: Extract<CardBlockLink['navTrigger'], 'link'>;
      newTab: boolean;
      url: string;
    }
  | {
      navTrigger: Extract<CardBlockLink['navTrigger'], 'card'>;
      newTab: boolean;
      url: string;
    };

/**
 * Resolve link details from a card block link field.
 *
 * Extends `resolveLinkGroup` with CardBlock's custom fields,
 * returning a shape suited for `usePayload`.
 *
 * @param link - The card block link field to resolve.
 * @returns Link details or `null` if the link cannot be resolved.
 */
export const resolveCardBlockLink = (
  link?: CardBlockLink
): ResolvedLink | null => {
  if (!link) {
    return null;
  }

  const { label, navTrigger, type: linkType } = link;

  if (typeof navTrigger !== 'string' || typeof linkType !== 'string') {
    return null;
  }

  const resolved = resolveLinkGroup(link);

  if (!resolved) {
    console.error(`Invalid ${linkType} link, expected a slug or a URL`, link);
    return null;
  }

  const { path: url, newTab } = resolved;

  return navTrigger === 'card'
    ? { navTrigger, newTab, url }
    : {
        // Label is a custom field (CardBlockLink uses skipLabel) — read directly
        // from the link, not from the base resolved group.
        label: String(label),
        navTrigger,
        newTab,
        url
      };
};
