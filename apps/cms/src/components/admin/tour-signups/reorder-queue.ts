import type { Config } from '@codeware/shared/util/payload-types';
import type { PayloadSDK } from '@payloadcms/sdk';

/**
 * Persist the waiting list order after a drag.
 *
 * Goes through the `tour-signups-reorder` endpoint rather than a row-by-row
 * update: a reorder is one decision, and half of it applied is a queue in an
 * order nobody chose. The endpoint writes every affected row in a single
 * transaction.
 *
 * @param sdk - Authenticated Payload SDK instance
 * @param tour - Tour whose queue is being reordered
 * @param ids - Signup ids in their new order, front of the queue first
 * @returns Whether the server accepted the new order
 */
export async function reorderQueue(
  sdk: PayloadSDK<Config>,
  tour: number,
  ids: Array<number>
): Promise<boolean> {
  try {
    const response = await sdk.request({
      method: 'POST',
      path: '/tour-signups-reorder',
      json: { tour, ids }
    });

    return response.ok;
  } catch {
    // Offline or rejected — the caller keeps the server's order on refresh
    return false;
  }
}
