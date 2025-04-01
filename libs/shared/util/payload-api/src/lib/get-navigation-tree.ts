import type { NavigationReferenceCollection } from '@codeware/shared/util/payload-types';

import { type RequestBaseOptions, invokeRequest } from './utils/invoke-request';

export type NavigationItem = {
  /**
   * The collection for the navigation item.
   */
  collection: NavigationReferenceCollection;

  /**
   * Unique identifier for the navigation item.
   */
  key: string;

  /**
   * Navigation label in the language declared in the request.
   */
  label: string;

  /**
   * The URL of the navigation item as a `collection/slug` string.
   *
   * Use `findNavigationDoc` to fetch the document from the CMS.
   */
  url: string;
};

/**
 * Get the site navigation tree.
 *
 * The router setup must be able to detect `/collection/slug` URLs,
 * where `collection` should be optional.
 *
 * Example:
 * ```ts
 * '/about-us'
 * '/articles'
 * '/posts/my-first-post'
 * '/media/ref-doc-123.pdf'
 * ```
 *
 * When the document data for the current route is requested,
 * use `findNavigationDoc` function which will match the signature.
 *
 * @param options - The options to get the site navigation tree with.
 * @returns The site navigation tree.
 * @throws A formatted error message when the request fails.
 */
export const getNavigationTree = async (
  options: RequestBaseOptions
): Promise<Array<NavigationItem>> => {
  const response = await invokeRequest('navigation', {
    ...options,
    method: 'GET'
  });

  if ('error' in response) {
    throw new Error(`Error fetching navigation: ${response.error}`);
  }

  const items = response.data[0].items ?? [];

  return items.reduce((acc, { customLabel, id, labelSource, reference }) => {
    if (typeof reference.value === 'number') {
      return acc;
    }

    const { relationTo, value } = reference;

    const key = id ?? String(value.id);

    const label =
      labelSource === 'custom' && customLabel
        ? customLabel
        : relationTo === 'pages'
          ? value.name
          : value.title;

    // Create URL where 'pages' is the default collection and not provided
    const url =
      relationTo === 'pages'
        ? String(value.slug)
        : `${relationTo}/${value.slug}`;

    return [
      ...acc,
      {
        collection: relationTo,
        key,
        label,
        url
      }
    ];
  }, [] as Array<NavigationItem>);
};
