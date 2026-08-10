import type { Where } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import { countDocs } from './count-docs';

/**
 * Count form submissions nobody has opened yet.
 *
 * Unread is `readAt` being null — the marker the submissions list sets when a
 * message is opened. Both the nav badge and the dashboard task read this
 * instead of the collection total, so the number falls as messages are dealt
 * with rather than growing forever.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param options - Optional workspace scope, applied alongside the filter
 * @returns Number of unread submissions, or `null` when the count fails
 */
export async function countUnreadSubmissions(
  runtime: PayloadRuntime,
  options: { tenantWhere?: Where } = {}
): Promise<number | null> {
  const { tenantWhere } = options;

  return countDocs(runtime, 'form-submissions', {
    where: {
      and: [
        ...(tenantWhere ? [tenantWhere] : []),
        { readAt: { exists: false } }
      ]
    }
  });
}
