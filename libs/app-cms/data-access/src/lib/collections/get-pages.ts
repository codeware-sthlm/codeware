import type { Page } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple pages.
 *
 * Default options:
 * - depth: 2
 * - limit: 50
 * - sort: 'name'
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Payload runtime instance
 * @param options - Query options for filtering, sorting, and pagination
 * @returns Object containing pages array and pagination metadata
 */
export async function getPages(
  runtime: PayloadRuntime,
  options: QueryMultipleOptions<'pages'> = {}
): Promise<PaginatedDocs<Page> | null> {
  const { payload, tenantConfig } = runtime;
  const { depth = 2, limit = 50, locale, where, sort = 'name' } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'pages',
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
