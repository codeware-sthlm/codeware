import type {
  CollectionSlug,
  CollectionWithoutPayload
} from '@codeware/shared/util/payload-types';

import { createRequestInit } from './create-request-init';
import { getDepth } from './get-depth';
import type { RequestMethod, RequestOptions } from './types';

type FetchResponse<
  T extends RequestMethod,
  C extends CollectionSlug
> = T extends 'GET'
  ? {
      docs: Array<CollectionWithoutPayload[C]>;
    }
  : CollectionWithoutPayload[C];

const collectionApiUrl = (apiUrl: string, collection: CollectionSlug) =>
  `${apiUrl}/api/${collection}`;

/**
 * Invoke a Payload REST API request with optional
 * API key authorization and signature verification.
 *
 * @param collection - The collection to invoke the request on.
 * @param options - The options to invoke the request with.
 * @returns The response from the request (`null` is returned when the request is not found) or an error message.
 */
export async function invokeRequest<TCollection extends CollectionSlug>(
  collection: TCollection,
  options: RequestOptions
): Promise<
  | {
      data: Array<CollectionWithoutPayload[TCollection]> | null;
      status: number;
    }
  | {
      error: string;
      status: number;
    }
> {
  const {
    apiUrl,
    debug,
    headers,
    method,
    requestCredentials,
    signatureVertification,
    tenantApiKey
  } = options;

  const requestInit = createRequestInit(method, {
    headers,
    requestCredentials,
    signatureVertification,
    tenantApiKey
  });

  // Build GET query params
  const queryParams =
    method === 'GET'
      ? [
          options.query,
          `depth=${getDepth(collection, options)}`,
          options.limit ? `limit=${options.limit ?? 0}` : ''
        ]
          .filter(Boolean)
          .join('&')
      : '';

  const requestUrl = `${collectionApiUrl(apiUrl, collection)}${queryParams ? `?${queryParams}` : ''}`;

  // Apply POST body to request init
  requestInit.body =
    method === 'POST' ? JSON.stringify(options.body) : undefined;

  if (debug) {
    console.log(`[PAYLOAD REQUEST] ${requestUrl}`, requestInit);
  }

  const response = await fetch(requestUrl, requestInit);

  if (debug) {
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log(
      `[PAYLOAD RESPONSE] ${response.status} ${response.statusText} | ${requestUrl}`,
      responseHeaders
    );
  }

  if (!response.ok) {
    return {
      error: response.statusText,
      status: response.status
    };
  }

  const res = await response.json();

  // GET response
  if (method === 'GET') {
    const { docs } = res as FetchResponse<'GET', TCollection>;
    return {
      data: docs ?? null,
      status: response.status
    };
  }

  // POST response
  return {
    data: res ? [res as FetchResponse<'POST', TCollection>] : null,
    status: response.status
  };
}
