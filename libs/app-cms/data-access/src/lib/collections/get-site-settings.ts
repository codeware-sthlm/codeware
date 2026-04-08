import type { TypedLocale } from 'payload';

import type { PayloadRuntime } from '../payload-runtime.types';

import type { QuerySingleOptions } from './types';

type Response = {
  appName: string;
  defaultLocale: TypedLocale;
  landingPage: number;
};

/**
 * Fetch site settings (shallow).
 *
 * This is a lightweight request with depth 0 to fetch configuration details
 * without pulling in the resolved relational data. Subsequent requests can then
 * fetch the related collection data using the proper locale.
 *
 * Site settings are typically a singleton collection, so this returns
 * the first (and usually only) document.
 *
 * Returns null if settings are not found or the user doesn't have access.
 *
 * This function respects access control when `authenticatedUser` is present.
 *
 * @param runtime - Authenticated Payload runtime instance
 * @returns Site settings or null
 */
export async function getSiteSettings(
  runtime: PayloadRuntime,
  options: Pick<QuerySingleOptions, 'locale'> = {}
): Promise<Response | null> {
  const { payload, tenantConfig } = runtime;
  const { locale } = options;
  const overrideAccess = payload.authenticatedUser === null;

  const result = await payload.find({
    collection: 'site-settings',
    depth: 0,
    limit: 1,
    locale: locale ?? tenantConfig?.locale,
    overrideAccess,
    user: payload.authenticatedUser,
    disableErrors: true
  });

  if (!result.totalDocs) {
    return null;
  }
  const {
    general: { appName, defaultLocale, landingPage }
  } = result.docs[0];

  return {
    appName,
    defaultLocale,
    landingPage: typeof landingPage === 'number' ? landingPage : landingPage.id
  };
}
