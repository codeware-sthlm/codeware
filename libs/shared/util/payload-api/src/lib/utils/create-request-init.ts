import { generateSignature } from '@codeware/shared/util/signature';

import { apiKeyPrefix, authorizationHeader } from './definitions';
import type { RequestInitOptions, RequestMethod } from './types';

/**
 * Create request configuration for `fetch` requests.
 *
 * Defaults to `'application/json'` content type when not provided in the `headers` option.
 */
export const createRequestInit = (
  method: RequestMethod,
  options: RequestInitOptions
): RequestInit => {
  const { headers, requestCredentials, signatureVertification, tenantApiKey } =
    options;

  let initHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(headers ?? {})
  };

  // Return early when there is no tenant API key
  if (!tenantApiKey) {
    return {
      headers: initHeaders,
      method
    };
  }

  // Apply API key authorization header
  initHeaders = {
    ...initHeaders,
    [authorizationHeader]: `${apiKeyPrefix} ${tenantApiKey}`
  };

  // Generate signature verification headers if useSignature is provided
  let signature: Record<string, string> = {};
  if (signatureVertification) {
    const { deployEnv, deviceId, secret, tenantId, userAgent } =
      signatureVertification;

    const reqUserAgent = userAgent ?? 'SSR';
    const computedUserAgent = `${reqUserAgent} ${tenantId} web/todo:version (${deployEnv})`;

    try {
      signature = generateSignature({
        deviceId,
        secret,
        userAgent: computedUserAgent
      });
    } catch (error) {
      console.error('Failed to generate signature', error);
    }
  }

  return {
    credentials: requestCredentials,
    headers: {
      ...initHeaders,
      ...signature
    },
    method
  };
};
