import { getAuthenticatedPayload } from '@codeware/app-cms/data-access';

import configPromise from '../payload.config';

/**
 * Get an authenticated Payload instance for server-side operations.
 *
 * The Payload instance is authenticated using the API key defined in environment
 * variables.
 *
 * @returns The Payload instance with authenticated user property.
 */
export const authenticatedPayload = async () => {
  const payloadConfig = await configPromise;
  return getAuthenticatedPayload(payloadConfig);
};
