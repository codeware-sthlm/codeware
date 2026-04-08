import type { Category } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple categories.
 *
 * Default options:
 * - depth: 2
 * - limit: 100
 * - sort: 'name'
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param options - Optional query options
 * @returns Object containing categories and metadata
 */
export async function getCategories(
  runtime: PayloadRuntime,
  options: QueryMultipleOptions<'categories'> = {}
): Promise<PaginatedDocs<Category> | null> {
  const { payload, tenantConfig } = runtime;
  const { depth = 2, limit = 100, locale, where, sort = 'name' } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'categories',
    where,
    depth,
    locale: locale ?? tenantConfig?.locale,
    limit,
    sort,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result;
}
