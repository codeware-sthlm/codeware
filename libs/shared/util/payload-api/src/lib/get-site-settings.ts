import type { SiteSetting } from '@codeware/shared/util/payload-types';

import { type RequestBaseOptions, invokeRequest } from './utils/invoke-request';

/**
 * Get the site settings.
 *
 * @param options - The options to get the site settings with.
 * @returns The site settings or `null` if the site settings are not found.
 * @throws A formatted error message when the request fails.
 */
export const getSiteSettings = async (
  options: RequestBaseOptions
): Promise<SiteSetting | null> => {
  const response = await invokeRequest('site-settings', {
    ...options,
    method: 'GET'
  });

  if ('error' in response) {
    throw new Error(`Error fetching site settings: ${response.error}`);
  }

  return response.data?.[0] ?? null;
};
