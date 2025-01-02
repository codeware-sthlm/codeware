import type { Page } from '@codeware/shared/util/payload';

import env from '../../env-resolver/env';

export type AppLoadContext = {
  tenantApiKey: string | undefined;
  tenantHost: string | undefined;
};

/**
 * The URL of the Payload API.
 */
export const PAYLOAD_API_URL = `${env.PAYLOAD_URL}/api/pages`;

/**
 * Request configuration for fetching pages.
 */
export const pagesInit = (context: AppLoadContext): RequestInit => {
  const apiKey =
    (env.DEPLOY_ENV === 'development' ? context.tenantApiKey : '') ||
    env.PAYLOAD_API_KEY;
  const tenantHost = context.tenantHost ?? '';

  const request: RequestInit = {
    headers: {
      Authorization: `tenants API-Key ${apiKey}`,
      'Tenant-Host': tenantHost
    },
    method: 'GET'
  };

  return request;
};

/**
 * The result of a page request.
 */
export type PageResult = {
  docs: Page[];
};
