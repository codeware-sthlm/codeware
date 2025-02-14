import type { Page } from '@codeware/shared/util/payload-types';

import {
  type AppLoadContext,
  PAYLOAD_API_URL,
  type PageResult,
  createRequestInit
} from './create-request-init';

/**
 * Fetches a page by its slug from the API.
 *
 * @returns A promise that resolves to a page, or `null` if no page was found.
 * @throws An error if the request fails.
 *
 * TODO: Make collection-specific generic function
 */
export const fetchPage = async (
  context: AppLoadContext,
  slug: string,
  request: Request
): Promise<Page | null> => {
  const response = await fetch(
    `${PAYLOAD_API_URL}?where[slug][equals]=${slug}&depth=2`,
    createRequestInit(context, request)
  );

  if (!response.ok) {
    throw new Error(
      `Error fetching page '${slug}': ${response.statusText} (${response.status})`
    );
  }

  const pageRes: PageResult = await response.json();

  return pageRes?.docs?.[0] ?? null;
};
