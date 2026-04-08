import {
  type NavigationItem,
  resolveNavigationTree
} from '@codeware/shared/util/payload-api';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch navigation tree.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Payload runtime instance
 * @returns Transformed navigation tree ready for rendering
 */
export async function getNavigationTree(
  runtime: PayloadRuntime,
  options: Pick<QuerySingleOptions, 'locale'> = {}
): Promise<NavigationItem[]> {
  const { payload, tenantConfig } = runtime;
  const { locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'navigation',
    depth: 2,
    locale: locale ?? tenantConfig?.locale,
    limit: 1,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  // Transform to UI-ready format
  return resolveNavigationTree(result.docs);
}
