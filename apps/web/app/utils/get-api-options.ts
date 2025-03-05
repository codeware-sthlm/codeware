import type { RequestOptions } from '@codeware/shared/util/payload-api';
import type { AppLoadContext as RemixAppLoadContext } from '@remix-run/node';

import env from '../../env-resolver/env';

export type AppLoadContext = {
  deviceId: string;
  tenantApiKey: string;
  tenantId: string;
};

/**
 * Get the options for a request to the Payload API.
 *
 * Api key authorization and signature verification are enabled.
 *
 * @param context - The context of the request.
 * @param request - The request.
 * @returns The options for the request.
 */
export const getApiOptions = (
  context: AppLoadContext | RemixAppLoadContext,
  request: Request
): RequestOptions => {
  const { deviceId, tenantApiKey, tenantId } = context as AppLoadContext;
  return {
    apiUrl: env.PAYLOAD_URL,
    debug: env.DEBUG,
    request,
    useSignature: {
      deployEnv: env.DEPLOY_ENV,
      deviceId,
      secret: env.SIGNATURE_SECRET,
      tenantId
    },
    tenantApiKey
  };
};
