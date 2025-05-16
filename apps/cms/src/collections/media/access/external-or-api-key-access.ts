import type { Access, Where } from 'payload';

import { verifyApiKeyAccess } from '@codeware/app-cms/util/access';
import type { Media } from '@codeware/shared/util/payload-types';

/**
 * This access control ensures unauthenticated static file request
 * must have external property enabled.
 *
 * For all other requests, api key access is verified via `verifyApiKeyAccess`,
 * which is required for all tenant enabled collections.
 *
 * @param secret - The secret used to verify the api key
 */
export const externalOrApiKeyAccess =
  (secret: string): Access<Media> =>
  async (args) => {
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
      const filenamesQuery: Array<Where> = [];

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
    return verifyApiKeyAccess({ secret })(args);
  };
