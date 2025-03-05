import type { CollectionBeforeChangeHook } from 'payload';

import type { Tenant } from '@codeware/shared/util/payload-types';

/**
 * Before change hook.
 *
 * Ensure that the API key is enabled for the tenant.
 *
 * @param data The data to populate
 * @returns The data with the `enableAPIKey` field set to true
 */
export const enforceApiKeyHook: CollectionBeforeChangeHook<Tenant> = ({
  data
}) => {
  return {
    ...data,
    enableAPIKey: true
  };
};
