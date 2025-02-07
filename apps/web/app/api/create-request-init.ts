import type { Page } from '@codeware/shared/util/payload-types';
import { generateSignature } from '@codeware/shared/util/signature';

import env from '../../env-resolver/env';

export type AppLoadContext = {
  deviceId: string;
  tenantApiKey: string;
  tenantId: string;
};

/**
 * The URL of the Payload API.
 *
 * TODO: Make this configurable and move to a function
 */
export const PAYLOAD_API_URL = `${env.PAYLOAD_URL}/api/pages`;

/**
 * Create request configuration for `fetch` requests.
 */
export const createRequestInit = (
  context: AppLoadContext,
  request: Request
): RequestInit => {
  const { deviceId, tenantApiKey, tenantId } = context;
  const {
    DEPLOY_ENV,
    PAYLOAD_API_KEY,
    SIGNATURE_SECRET: secret,
    TENANT_ID
  } = env;

  const apiKey = tenantApiKey ?? PAYLOAD_API_KEY;
  const reqUserAgent = `${request.headers.get('User-Agent')}`;
  const userAgent = `${reqUserAgent} ${tenantId ?? TENANT_ID} web/todo:version (${DEPLOY_ENV})`;

  let signature: Record<string, string> = {};

  try {
    signature = generateSignature({
      deviceId,
      secret,
      userAgent
    });
  } catch (error) {
    console.error('Failed to generate signature', error);
  }

  const headers: HeadersInit = {
    ...request.headers,
    Authorization: `tenants API-Key ${apiKey}`,
    'X-Tenant-Auth': `tenants API-Key ${apiKey}`,
    ...signature
  };

  const requestInit: RequestInit = {
    headers,
    method: 'GET'
  };

  return requestInit;
};

/**
 * The result of a page request.
 */
export type PageResult = {
  docs: Page[];
};
