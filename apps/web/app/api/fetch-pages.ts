import type { Page } from '@codeware/shared/util/payload';

import {
  type AppLoadContext,
  PAYLOAD_API_URL,
  type PageResult,
  pagesInit
} from './request';

/**
 * Fetches all pages from the API.
 *
 * @returns A promise that resolves to an array of pages.
 * @throws An error if the request fails.
 */
export const fetchPages = async (context: AppLoadContext): Promise<Page[]> => {
  const response = await fetch(
    `${PAYLOAD_API_URL}?depth=0&limit=100`,
    pagesInit(context)
  );

  if (!response.ok) {
    console.error(response);
    throw new Error(
      `Error fetching pages: ${response.status}\n${response.statusText}`
    );
  }

  const pageRes: PageResult = await response.json();

  return pageRes?.docs ?? [];
};
