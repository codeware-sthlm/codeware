import type {
  MethodOptions,
  RequestBaseOptions,
  RequestMethod
} from '@codeware/shared/util/payload-api';
import type { AppLoadContext as RemixAppLoadContext } from '@remix-run/node';

import env from '../../env-resolver/env';

export type AppLoadContext = {
  deviceId: string;
  tenantApiKey: string;
  tenantId: string;
};

/**
 * Get the options for a request to the Payload REST API.
 *
 * Api key authorization and signature verification are enabled.
 *
 * @param context - The context of the request.
 * @param request - The request.
 * @returns The options for the request.
 */
export function getPayloadRequestOptions(
  method: 'GET',
  context: AppLoadContext | RemixAppLoadContext,
  headers?: Headers
): RequestBaseOptions;
export function getPayloadRequestOptions<TBody = Record<string, unknown>>(
  method: 'POST',
  context: AppLoadContext | RemixAppLoadContext,
  headers?: Headers,
  body?: TBody
): RequestBaseOptions & MethodOptions<'POST'>;
export function getPayloadRequestOptions<
  T extends RequestMethod,
  TBody = Record<string, unknown>
>(
  method: T,
  context: AppLoadContext | RemixAppLoadContext,
  headers?: Headers,
  body?: TBody
): RequestBaseOptions | (RequestBaseOptions & MethodOptions<'POST'>) {
  const { deviceId, tenantApiKey, tenantId } = context as AppLoadContext;

  const baseOptions: RequestBaseOptions = {
    apiUrl: env.PAYLOAD_URL,
    debug: env.DEBUG,
    headers,
    signatureVertification: {
      deployEnv: env.DEPLOY_ENV,
      deviceId,
      secret: env.SIGNATURE_SECRET,
      tenantId,
      userAgent: headers?.get('User-Agent') ?? null
    },
    tenantApiKey
  };

  if (method === 'GET') {
    return baseOptions;
  }

  return {
    ...baseOptions,
    body: body ?? {}
  };
}
