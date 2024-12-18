import { Page } from '@codeware/shared/util/payload';

import env from '../../env-resolver/env';

/**
 * The URL of the Payload API.
 */
export const PAYLOAD_API_URL = `${env.PAYLOAD_URL}/api/pages`;

/**
 * Request configuration for fetching pages.
 */
export const pagesInit = {
  headers: {
    Authorization: `tenants API-Key ${env.PAYLOAD_API_KEY}`
  },
  method: 'GET'
} satisfies RequestInit;

/**
 * The result of a page request.
 */
export type PageResult = {
  docs: Page[];
};
