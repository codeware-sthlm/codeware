import type { TourSignup } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple tour signups.
 *
 * Default options:
 * - depth: 0
 * - limit: 100
 * - sort: 'createdAt'
 *
 * Sorted oldest first, unlike messages: a signup list is read as a passenger
 * list, and arrival order is the order the guide thinks in. The waiting queue
 * is re-sorted by its own position where it is rendered.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param options - Optional query options
 * @returns Object containing signups and metadata
 */
export async function getTourSignups(
  runtime: PayloadRuntime,
  options: QueryMultipleOptions<'tour-signups'> = {}
): Promise<PaginatedDocs<TourSignup> | null> {
  const { payload, tenantConfig } = runtime;
  const {
    depth = 0,
    limit = 100,
    locale,
    page,
    where,
    sort = 'createdAt'
  } = options;

  return await payload.find({
    collection: 'tour-signups',
    where,
    depth,
    locale: locale ?? tenantConfig?.locale,
    limit,
    page,
    sort,
    overrideAccess: payload.authenticatedUser === null,
    user: payload.authenticatedUser,
    disableErrors: true
  });
}
