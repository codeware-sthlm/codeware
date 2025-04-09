import { getId } from '@codeware/app-cms/util/misc';
import type { SiteSetting } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type SiteSettingData = Pick<SiteSetting, 'general' | 'tenant'>;

/**
 * Ensure that a site setting exist with the given tenant.
 *
 * Update general setting values when missing.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Site setting data
 * @returns The site setting ID if exists or the object when created, otherwise undefined
 */
export async function ensureSiteSetting(
  payload: Payload,
  transactionID: string | number | undefined,
  data: SiteSettingData
): Promise<SiteSetting | string | number> {
  const { general: generalFromProps, tenant } = data;

  if (!tenant) {
    throw new Error('Tenant is required');
  }

  // Check if the site setting exists with the given tenant
  const siteSettings = await payload.find({
    collection: 'site-settings',
    where: {
      tenant: { in: [getId(tenant)] }
    },
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (siteSettings.totalDocs) {
    const { general, id } = siteSettings.docs[0];

    if (general.appName && general.landingPage) {
      return id;
    }

    // Update missing values
    await payload.update({
      collection: 'site-settings',
      id,
      data: {
        general: {
          ...general,
          appName: general.appName ?? generalFromProps.appName,
          landingPage: general.landingPage ?? generalFromProps.landingPage
        }
      }
    });

    return id;
  }

  // No site setting found, create one

  const newSiteSetting = await payload.create({
    collection: 'site-settings',
    data: {
      general: generalFromProps,
      tenant
    },
    req: { transactionID }
  });

  return newSiteSetting;
}
