import * as Sentry from '@sentry/nextjs';

/**
 * Tag the current request with the tenant it acts for.
 *
 * All tenants share one Sentry project and release, so this tag is what tells
 * them apart. Tenant-mode deployments set it once at boot, but a host-mode
 * deployment serves every tenant from one process and has to tag per request.
 *
 * The Next.js SDK gives each request its own isolation scope, so the tag only
 * reaches events from the request that set it.
 *
 * @param slug - Tenant slug of the authenticated identity
 */
export const setSentryTenantTag = (slug: string): void => {
  Sentry.getIsolationScope().setTag('tenant', slug);
};
