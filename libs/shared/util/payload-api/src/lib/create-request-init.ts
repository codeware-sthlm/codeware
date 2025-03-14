import { generateSignature } from '@codeware/shared/util/signature';

import { apiKeyPrefix, authorizationHeader } from './definitions';

export type RequestInitOptions = {
  request: Request;

  /**
   * Whether to allow HTTP-only cookies depending on client and server domains.
   *
   * When the client is on a different domain than the Payload API and `useSignature` is provided,
   * the value should be set to `'include'`.
   *
   * @default undefined
   */
  requestCredentials?: RequestCredentials;

  /**
   * Provide the signature configuration
   * to enable signature verification for the request.
   */
  useSignature?: {
    deployEnv: string;
    deviceId: string;
    secret: string;
    tenantId: string;
  };
  /**
   * Provide the tenant API key to enable API key authorization
   * for the request.
   */
  tenantApiKey?: string;
};

/**
 * Create request configuration for `fetch` requests.
 */
export const createRequestInit = (
  method: 'GET',
  options: RequestInitOptions
): RequestInit => {
  const { request, requestCredentials, useSignature, tenantApiKey } = options;

  let initHeaders: HeadersInit = request.headers;

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
  if (useSignature) {
    const { deviceId, secret, tenantId, deployEnv } = useSignature;

    const reqUserAgent = `${request.headers.get('User-Agent')}`;
    const userAgent = `${reqUserAgent} ${tenantId} web/todo:version (${deployEnv})`;

    try {
      signature = generateSignature({
        deviceId,
        secret,
        userAgent
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
