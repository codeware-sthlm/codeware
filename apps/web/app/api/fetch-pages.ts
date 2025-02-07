import type { Page } from '@codeware/shared/util/payload-types';

import env from '../../env-resolver/env';

import {
  type AppLoadContext,
  PAYLOAD_API_URL,
  type PageResult,
  createRequestInit
} from './create-request-init';

/**
 * Fetches all pages from the API.
 *
 * @returns A promise that resolves to an array of pages.
 * @throws An error if the request fails.
 *
 * TODO: Make collection-specific generic function
 */
export const fetchPages = async (
  context: AppLoadContext,
  request: Request
): Promise<Page[]> => {
  const init = createRequestInit(context, request);

  const response = await fetch(`${PAYLOAD_API_URL}?depth=0&limit=100`, init);

  if (!response.ok) {
    throw new Error(
      `Error fetching pages: ${response.status} - ${response.statusText}`
    );
  }

  const pageRes: PageResult = await response.json();

  return pageRes?.docs ?? [];
};
