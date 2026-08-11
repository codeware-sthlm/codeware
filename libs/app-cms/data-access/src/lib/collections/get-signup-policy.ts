import {
  type SignupPolicy,
  resolveSignupPolicy
} from '@codeware/shared/util/payload-api';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch what the tour signup form must disclose about personal data.
 *
 * **Kept at depth 1** so the privacy and terms relations resolve to page slugs
 * — the form needs links, not ids.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @returns The policy; empty rather than null when nothing is configured, so
 *   the form can still state what it collects
 */
export async function getSignupPolicy(
  runtime: PayloadRuntime,
  options: Pick<QuerySingleOptions, 'locale'> = {}
): Promise<SignupPolicy> {
  const { payload, tenantConfig } = runtime;
  const { locale } = options;

  const result = await payload.find({
    collection: 'site-settings',
    depth: 1,
    limit: 1,
    locale: locale ?? tenantConfig?.locale,
    overrideAccess: payload.authenticatedUser === null,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return resolveSignupPolicy(result.docs[0] ?? null);
}
