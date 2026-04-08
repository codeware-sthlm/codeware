import type { Media } from '@codeware/shared/util/payload-types';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single media item by ID.
 *
 * Returns null if the media is not found or the user doesn't have access.
 *
 * Default options:
 * - depth: 1
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Payload runtime instance
 * @param id - ID of the media to fetch
 * @param options - Media query options including ID
 * @returns Media document or null
 */
export async function getMedia(
  runtime: PayloadRuntime,
  id: number,
  options: QuerySingleOptions = {}
): Promise<Media | null> {
  const { payload, tenantConfig } = runtime;
  const { depth = 1, locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const media = await payload.findByID({
    collection: 'media',
    id,
    depth,
    locale: locale ?? tenantConfig?.locale,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return media;
}
