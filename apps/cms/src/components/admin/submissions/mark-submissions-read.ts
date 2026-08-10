import type { Config } from '@codeware/shared/util/payload-types';
import type { PayloadSDK } from '@payloadcms/sdk';

/**
 * Flag submissions as read for the current user's workspace.
 *
 * Goes through the `form-submissions-read` endpoint rather than
 * `sdk.update()`: submissions are immutable (`update: () => false`), and that
 * endpoint is what authorizes the write.
 *
 * @param sdk - Authenticated Payload SDK instance
 * @param ids - Submission ids to mark
 * @param read - False to clear the marker again
 * @returns The ids the server actually updated; empty when the call failed
 */
export async function markSubmissionsRead(
  sdk: PayloadSDK<Config>,
  ids: Array<number>,
  read = true
): Promise<Array<number>> {
  try {
    const response = await sdk.request({
      method: 'POST',
      path: '/form-submissions-read',
      json: { ids, read }
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { updated?: Array<number> };
    return data.updated ?? [];
  } catch {
    // Offline or rejected — the caller rolls back its optimistic state
    return [];
  }
}
