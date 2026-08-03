import {
  type FooterData,
  type NavigationItem,
  resolveFooter
} from '@codeware/shared/util/payload-api';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

/**
 * Fetch the site footer.
 *
 * **Kept at depth 2** to resolve the slug of documents referenced by custom
 * footer links.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Payload runtime instance
 * @param navigationTree - Navigation tree, used when the footer mirrors the top navigation
 * @returns Footer data ready for rendering, or `null` when there is no footer to render
 */
export async function getFooter(
  runtime: PayloadRuntime,
  navigationTree: NavigationItem[],
  options: Pick<QuerySingleOptions, 'locale'> = {}
): Promise<FooterData | null> {
  const { payload, tenantConfig } = runtime;
  const { locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'site-settings',
    depth: 2,
    limit: 1,
    locale: locale ?? tenantConfig?.locale,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  return resolveFooter(result.docs[0] ?? null, navigationTree);
}
