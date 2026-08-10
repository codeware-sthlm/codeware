import type { Form } from '@codeware/shared/util/payload-types';
import type { PaginatedDocs } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QueryMultipleOptions } from './types';

/**
 * Fetch multiple forms.
 *
 * Default options:
 * - depth: 0
 * - limit: 100
 * - sort: 'title'
 *
 * Defaults to `depth: 0` because callers want the form definitions
 * themselves — nothing a form relates to.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param options - Optional query options
 * @returns Object containing forms and metadata
 */
export async function getForms(
  runtime: PayloadRuntime,
  options: QueryMultipleOptions<'forms'> = {}
): Promise<PaginatedDocs<Form> | null> {
  const { payload, tenantConfig } = runtime;
  const {
    depth = 0,
    limit = 100,
    locale,
    page,
    where,
    sort = 'title'
  } = options;

  const result = await payload.find({
    collection: 'forms',
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
