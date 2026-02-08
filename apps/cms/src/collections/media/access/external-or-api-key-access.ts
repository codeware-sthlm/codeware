import type { Access, Where } from 'payload';

import type { Media } from '@codeware/shared/util/payload-types';

import { userOrApiKeyAccess } from '../../../security/user-or-api-key-access';

/**
 * This access control ensures unauthenticated static file request
 * must have external property enabled.
 *
 * For all other requests, api key access is verified via `apiKeyAccess`,
 * which is required for all tenant enabled collections.
 */
export const externalOrApiKeyAccess = (): Access<Media> => async (args) => {
  const { data, isReadingStaticFile, req } = args;
  const { payload, user } = req;

  // If the request is for a static file and no user is authenticated,
  // lookup the document via filename and check if external is enabled.
  if (isReadingStaticFile && !user) {
    const filename = data?.filename;
    if (!filename) {
      payload.logger.error(
        'externalOrApiKeyAccess: Expected a filename value in data'
      );
      return false;
    }
    const { config } = payload.collections.media;

    // File name can be the main name or one of the image sizes
    // e.g. filename: 'image.jpg', sizes: { small: { filename: 'image-small.jpg' } }
    const filenamesQuery: Where[] = [];

    // Main filename
    filenamesQuery.push({
      filename: {
        equals: filename
      }
    });

    // Image sizes filenames
    if (config.upload.imageSizes) {
      config.upload.imageSizes.forEach(({ name }) => {
        filenamesQuery.push({
          [`sizes.${name}.filename`]: {
            equals: filename
          }
        });
      });
    }

    /**
     * To consider:
     *
     * Is it possible to know the tenant here to further restrict the query?
     * Probably not, since this is an unauthenticated request,
     * unless we parse the host header to determine the tenant?
     *
     * For now we'll do a global lookup and the fact that the file is marked external
     * will be sufficient to allow public access.
     */

    const doc = await payload.find({
      collection: 'media',
      limit: 1,
      depth: 0,
      where: { or: filenamesQuery },
      req
    });

    if (!doc.totalDocs) {
      return false;
    }

    // Allow access if the file is marked external
    return doc.docs[0].external === true;
  }

  // Default: Resolve api key access for tenant enabled collection
  return userOrApiKeyAccess()(args);
};
