import type { CollectionSlug, Where } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

/**
 * Count documents in a collection.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param collection - Collection slug to count documents in
 * @param options - Optional where clause for filtering
 * @returns Total number of accessible documents, or `null` when the count fails
 */
export async function countDocs(
  runtime: PayloadRuntime,
  collection: CollectionSlug,
  options: { where?: Where } = {}
): Promise<number | null> {
  const { payload } = runtime;
  const { where } = options;

  try {
    const { totalDocs } = await payload.count({
      collection,
      where,
      overrideAccess: payload.authenticatedUser === null,
      user: payload.authenticatedUser
    });
    return totalDocs;
  } catch {
    // Mirror the `disableErrors` semantics of the find-based functions
    return null;
  }
}
