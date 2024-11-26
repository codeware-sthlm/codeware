import { Page } from '@codeware/shared/util/payload';

import { PAYLOAD_API_URL, PageResult, pagesInit } from './request';

/**
 * Fetches a page by its slug from the API.
 *
 * @returns A promise that resolves to a page, or `null` if no page was found.
 * @throws An error if the request fails.
 */
export const fetchPage = async (
  slug: string
): Promise<Page | undefined | null> => {
  const response = await fetch(
    `${PAYLOAD_API_URL}?where[slug][equals]=${slug}&depth=2`,
    pagesInit
  );

  if (!response.ok) {
    console.error(`Error fetching page "${slug}": ${response}`);
    throw new Error(`Error fetching page "${slug}": ${response.status}`);
  }

  const pageRes: PageResult = await response.json();

  return pageRes?.docs?.[0] ?? null;
};
