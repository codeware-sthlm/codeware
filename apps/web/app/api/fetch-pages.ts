import { Page } from '@codeware/shared/util/payload';

import { PAYLOAD_API_URL, PageResult, pagesInit } from './request';

/**
 * Fetches all pages from the API.
 *
 * @returns A promise that resolves to an array of pages.
 * @throws An error if the request fails.
 */
export const fetchPages = async (): Promise<Page[]> => {
  const response = await fetch(
    `${PAYLOAD_API_URL}?depth=0&limit=100`,
    pagesInit
  );

  if (!response.ok) {
    throw new Error(
      `Error fetching pages: ${response.status}\n${response.statusText}`
    );
  }

  const pageRes: PageResult = await response.json();

  return pageRes?.docs ?? [];
};
