import type { Navigation } from '@codeware/shared/util/payload-types';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Use case?
 *
 * Fetch navigation documents.
 *
 * Use this when you need the full Payload document structure
 * instead of the transformed navigation tree.
 *
 * Navigation is typically a singleton collection, so this returns
 * the first (and usually only) document, holding the navigation data.
 *
 * Return `null` when no documents were found or access is denied.
 *
 * Default options:
 * - depth: 2
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Payload runtime instance
 * @param options - Optional query parameters
 * @returns Navigation document or null
 */
export async function getNavigationDocs(
  runtime: PayloadRuntime,
  options: QuerySingleOptions = {}
): Promise<Navigation | null> {
  const { payload, tenantConfig } = runtime;
  const { depth = 2, locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'navigation',
    depth,
    locale: locale ?? tenantConfig?.locale,
    limit: 1,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result.totalDocs ? result.docs[0] : null;
}
