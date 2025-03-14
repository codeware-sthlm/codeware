import type {
  CollectionSlug,
  CollectionWithoutPayload
} from '@codeware/shared/util/payload-types';

import { createRequestInit } from './create-request-init';
import type { RequestInitOptions } from './create-request-init';

type GETResponse<T extends CollectionSlug> = {
  docs: Array<CollectionWithoutPayload[T]>;
};

export type RequestOptions = RequestInitOptions & {
  /**
   * The URL of the Payload CMS API host.
   * @example 'https://payload-cms.com'
   */
  apiUrl: string;
  /**
   * Whether to enable debug logging on requests.
   * @default false
   */
  debug?: boolean;
  /**
   * The depth of the request.
   * @default 2
   */
  depth?: number;
  /**
   * The limit of the request, must be greater than 0 when provided.
   */
  limit?: number;
  /**
   * The query to invoke the request with.
   * @example 'where[slug][equals]=home'
   */
  query?: string;
};

const collectionApiUrl = (apiUrl: string, collection: CollectionSlug) =>
  `${apiUrl}/api/${collection}`;

/**
 * Invoke a GET request to the Payload API with optional
 * API key authorization and signature verification.
 *
 * @param collection - The collection to invoke the request on.
 * @param query - The query to invoke the request with.
 * @param initOptions - The options to invoke the request with.
 * @returns The response from the request or an error description.
 */
export const invokeRequest = async <T extends CollectionSlug>(
  collection: T,
  { apiUrl, depth = 2, limit = 0, query, ...initOptions }: RequestOptions
): Promise<
  | {
      data: Array<CollectionWithoutPayload[T]> | null;
    }
  | {
      error: string;
    }
> => {
  const init = createRequestInit('GET', initOptions);

  const queryParams = [query, `depth=${depth}`, limit ? `limit=${limit}` : '']
    .filter(Boolean)
    .join('&');

  const requestUrl = `${collectionApiUrl(apiUrl, collection)}${queryParams ? `?${queryParams}` : ''}`;

  if (initOptions.debug) {
    console.log(`[PAYLOAD REQUEST] ${requestUrl}`, init);
  }

  const response = await fetch(requestUrl, init);

  if (initOptions.debug) {
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
      error: `${response.statusText} (${response.status})`
    };
  }

  const res: GETResponse<T> = await response.json();

  return {
    data: res?.docs ?? null
  };
};
