import type { TenantRuntimeConfig } from '@codeware/shared/util/payload-types';
import type { LandingDoc } from '@codeware/shared/util/payload-utils';

import { findById } from './find-by-id';
import { getBlocksData } from './get-blocks-data';
import type { RequestBaseOptions } from './utils/types';

/**
 * Find the tenant's landing page document together with the data its blocks
 * need, so a client never fetches the two halves itself.
 *
 * @param landingPage - The landing page reference from the tenant config.
 * @param options - The options to find the document with.
 * @returns The tagged landing document or `null` if it is not found.
 * @throws A formatted error message when the request fails.
 */
export const findLandingDoc = async (
  landingPage: TenantRuntimeConfig['landingPage'],
  options: RequestBaseOptions
): Promise<LandingDoc | null> => {
  const doc = await findById(landingPage.collection, landingPage.id, options);
  if (!doc) return null;

  return {
    collection: 'pages',
    doc,
    blocksData: await getBlocksData(doc.layout, options)
  };
};
