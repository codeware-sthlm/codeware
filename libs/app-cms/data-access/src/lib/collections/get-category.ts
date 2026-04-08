import type { Category } from '@codeware/shared/util/payload-types';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single category by slug.
 *
 * Returns null if the category is not found or the user doesn't have access.
 *
 * Default options:
 * - depth: 2
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param slug - Slug of the category to fetch
 * @param options - Optional query options
 * @returns Category document or null
 */
export async function getCategory(
  runtime: PayloadRuntime,
  slug: string,
  options: QuerySingleOptions = {}
): Promise<Category | null> {
  const { depth = 2, locale } = options;
  const { payload, tenantConfig } = runtime;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'categories',
    where: {
      slug: { equals: slug }
    },
    depth,
    locale: locale ?? tenantConfig?.locale,
    limit: 1,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result.totalDocs ? result.docs[0] : null;
}
