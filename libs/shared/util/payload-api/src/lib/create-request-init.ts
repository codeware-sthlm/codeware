import { generateSignature } from '@codeware/shared/util/signature';

export type RequestInitOptions = {
  request: Request;
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
  const { request, useSignature, tenantApiKey } = options;

  let initHeaders: HeadersInit = request.headers;

  // Return early when there is no tenant API key
  if (!tenantApiKey) {
    return {
      headers: initHeaders,
      method
    };
  }

  // Apply tenant API key authorization header
  initHeaders = {
    ...initHeaders,
    Authorization: `tenants API-Key ${tenantApiKey}`
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
    headers: {
      ...initHeaders,
      ...signature
    },
    method
  };
};
