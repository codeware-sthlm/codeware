import type { Media } from '@codeware/shared/util/payload-types';

import type { AuthenticatedPayload } from '../get-authenticated-payload';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single media item by ID with proper access control.
 *
 * Returns null if the media is not found or the user doesn't have access.
 *
 * Default options:
 * - depth: 1
 *
 * @param payload - Authenticated Payload instance
 * @param id - ID of the media to fetch
 * @param options - Media query options including ID
 * @returns Media document or null
 */
export async function getMedia(
  payload: AuthenticatedPayload,
  id: number,
  options: QuerySingleOptions
): Promise<Media | null> {
  const { depth = 1, locale } = options;

  try {
    const media = await payload.findByID({
      collection: 'media',
      id,
      depth,
      locale,
      overrideAccess: false,
      user: payload.authenticatedUser
    });

    return media;
  } catch {
    // Media not found or access denied
    return null;
  }
}
