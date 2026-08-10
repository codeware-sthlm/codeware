import type { Form } from '@codeware/shared/util/payload-types';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch a single form by id.
 *
 * Default options:
 * - depth: 0
 *
 * Defaults to `depth: 0` because callers want the field definitions
 * themselves — nothing a form relates to.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @param id - Form id
 * @param options - Optional query options
 * @returns The form, or `null` when it does not exist or is not readable
 */
export async function getForm(
  runtime: PayloadRuntime,
  id: number | string,
  options: QuerySingleOptions = {}
): Promise<Form | null> {
  const { payload, tenantConfig } = runtime;
  const { depth = 0, locale } = options;

  const result = await payload.findByID({
    collection: 'forms',
    id,
    depth,
    locale: locale ?? tenantConfig?.locale,
    overrideAccess: payload.authenticatedUser === null,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return result ?? null;
}
