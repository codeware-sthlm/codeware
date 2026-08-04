import type { Tour } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import { resolveDraftQuery } from './resolve-draft-query';
import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple tours.
 *
 * Default options:
 * - depth: 2
 * - limit: 20
 * - sort: '-createdAt'
 *
 * Set `draft: true` to evaluate filters and sorting against each document's
 * newest version (including unpublished drafts) instead of the main table
 * row. Access and tenant scoping in draft mode are handled by
 * `resolveDraftQuery`.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param options - Query options for filtering, sorting, and pagination
 * @returns Object containing tours array and pagination metadata
 */
export async function getTours(
  runtime: PayloadRuntime,
  options: QueryMultipleOptions<'tours'> = {}
): Promise<PaginatedDocs<Tour> | null> {
  const { payload, tenantConfig } = runtime;
  const {
    depth = 2,
    draft,
    limit = 20,
    locale,
    where,
    sort = '-createdAt'
  } = options;
  const { overrideAccess, where: scopedWhere } = resolveDraftQuery(
    runtime,
    draft,
    where
  );

  const result = await payload.find({
    collection: 'tours',
    where: scopedWhere,
    depth,
    draft,
    locale: locale ?? tenantConfig?.locale,
    limit,
    sort,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result;
}
