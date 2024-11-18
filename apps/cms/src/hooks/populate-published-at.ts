import type { CollectionBeforeChangeHook } from 'payload/types';

import { Page } from '../generated/payload-types';

/**
 * Populates the `publishedAt` field with the current date and time if it is not already set.
 *
 * @param data The data to populate
 * @param operation The operation being performed
 *
 * @returns The data with the `publishedAt` field populated
 */
export const populatePublishedAt: CollectionBeforeChangeHook<Page> = ({
  data,
  operation
}) => {
  if (operation === 'create' || operation === 'update') {
    if (data && !data.publishedAt) {
      const now = new Date();
      return {
        ...data,
        publishedAt: now
      };
    }
  }

  return data;
};
