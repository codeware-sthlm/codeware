import { invokeRequest } from './utils/invoke-request';
import { resolveNavigationTree } from './utils/resolve-navigation-tree';
import type { NavigationItem, RequestBaseOptions } from './utils/types';

/**
 * Get the site navigation tree.
 *
 * When the document data for the current route is requested,
 * use `findNavigationDoc` function which will match the signature.
 *
 * @param options - The options to get the site navigation tree with.
 * @returns The site navigation tree or an empty array if it has not been setup in the CMS.
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

  return resolveNavigationTree(response.data || []);
};
