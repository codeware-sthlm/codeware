import { isTenant } from '@codeware/app-cms/util/misc';
import { TenantRuntimeConfig } from '@codeware/shared/util/payload-types';
import type { SanitizedConfig } from 'payload';

import { getSiteSettings } from './collections/get-site-settings';
import { getAuthenticatedPayload } from './get-authenticated-payload';
import type { PayloadRuntime } from './payload-runtime.types';

/**
 * Get the authenticated payload and tenant runtime config.
 *
 * Tenant config can not be provided if there is no authenticated tenant user
 * or if the tenant's site settings cannot be loaded for the tenant.
 */
export async function getPayloadRuntime(
  payloadConfig: SanitizedConfig
): Promise<PayloadRuntime> {
  const payload = await getAuthenticatedPayload(payloadConfig);
  const siteSettings = await getSiteSettings({ payload, tenantConfig: null });

  // If we don't have a tenant user or site settings, we can't provide tenant-specific config
  if (!isTenant(payload.authenticatedUser)) {
    return {
      payload,
      tenantConfig: null
    };
  }
  if (!siteSettings) {
    // This can happen if the tenant's API key is invalid or missing,
    // or if the tenant user doesn't have access to the site settings
    return {
      payload,
      tenantConfig: null
    };
  }

  const tenantConfig: TenantRuntimeConfig = {
    appName: siteSettings.appName,
    icon: siteSettings.icon,
    locale: siteSettings.defaultLocale,
    fallbackLocale: null,
    landingPage: { collection: 'pages', id: siteSettings.landingPage },
    tenant: payload.authenticatedUser
  };

  return {
    payload,
    tenantConfig
  };
}
