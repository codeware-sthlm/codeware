import type { Tour } from '@codeware/shared/util/payload-types';

import { invokeRequest } from './utils/invoke-request';
import type { RequestBaseOptions } from './utils/types';

/**
 * Find tours sorted by creation date descending.
 *
 * @param options - The options to find tours with.
 * @param options.limit - Maximum number of tours to return.
 * @returns The list of tours.
 * @throws A formatted error message when the request fails.
 */
export const findTours = async (
  options: RequestBaseOptions & { limit?: number }
): Promise<Array<Tour>> => {
  const { limit, ...baseOptions } = options;

  const response = await invokeRequest('tours', {
    ...baseOptions,
    method: 'GET',
    query: 'sort=-createdAt',
    limit
  });

  if ('error' in response) {
    throw new Error(`Error fetching tours: ${response.error}`);
  }

  return (response.data as Array<Tour>) ?? [];
};
