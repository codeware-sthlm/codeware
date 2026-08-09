import type { Media, StockMedia } from '@codeware/shared/util/payload-types';
import mimeTypes from 'mime-types';
import type { CollectionBeforeValidateHook } from 'payload';

/**
 * Fall back to the filename when a upload arrives without a mime type.
 *
 * Seeded files are fetched over http and handed to Payload as a buffer, so the
 * type depends on the response carrying a `Content-Type`. A collection that
 * restricts `mimeTypes` rejects the upload outright when it does not.
 */
export const ensureMimeType: CollectionBeforeValidateHook<
  Media | StockMedia
> = ({ data, operation }) => {
  if (!data || data.mimeType) {
    return data;
  }

  if (operation === 'create' || operation === 'update') {
    data.mimeType = mimeTypes.lookup(data.filename ?? '') || undefined;
  }

  return data;
};
