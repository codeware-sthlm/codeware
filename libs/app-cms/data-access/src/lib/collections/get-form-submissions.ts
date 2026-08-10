import type { FormSubmission } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple form submissions.
 *
 * Default options:
 * - depth: 0
 * - limit: 25
 * - sort: '-createdAt'
 *
 * Defaults to `depth: 0` — the admin resolves form titles and field labels
 * from a single forms query rather than populating the relation per row.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param options - Optional query options
 * @returns Object containing submissions and metadata
 */
export async function getFormSubmissions(
  runtime: PayloadRuntime,
  options: QueryMultipleOptions<'form-submissions'> = {}
): Promise<PaginatedDocs<FormSubmission> | null> {
  const { payload, tenantConfig } = runtime;
  const {
    depth = 0,
    limit = 25,
    locale,
    page,
    where,
    sort = '-createdAt'
  } = options;

  const result = await payload.find({
    collection: 'form-submissions',
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

  return result;
}
