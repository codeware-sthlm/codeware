import type { CollectionBeforeChangeHook } from 'payload/types';

import type { Tenant } from '../generated/payload-types';

/**
 * Ensure that the API key is enabled for the tenant.
 *
 * @param data The data to populate
 * @returns The data with the `enableAPIKey` field set to true
 */
export const enforceApiKey: CollectionBeforeChangeHook<Tenant> = ({ data }) => {
  return {
    ...data,
    enableAPIKey: true
  };
};
