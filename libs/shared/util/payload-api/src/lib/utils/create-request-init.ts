import { generateSignature } from '@codeware/shared/util/signature';

import {
  type RequestMethod,
  apiKeyPrefix,
  authorizationHeader
} from './definitions';

export type RequestInitOptions = {
  /**
   * Optional headers to include in the request.
   *
   * @default undefined
   */
  headers?: HeadersInit;

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
   * Enable signature verification for the request
   * by providing the required application details.
   *
   * @default undefined
   */
  signatureVertification?: {
    deployEnv: string;
    deviceId: string;
    secret: string;
    tenantId: string;
    /**
     * Browser user agent to include in the signature.
     *
     * Set to `null` when the request is invoked from a server-side context
     * without access to the request object.
     * The user agent will be set to `'SSR'` in this case.
     *
     * @example
     * ```ts
     * const userAgent = request.headers.get('User-Agent')
     * ```
     */
    userAgent: string | null;
  };

  /**
   * Enable API key authorization for the request
   * by providing the tenant API key for the application.
   *
   * @default undefined
   */
  tenantApiKey?: string;
};

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
