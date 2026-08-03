import { getId } from '@codeware/app-cms/util/misc';
import type { SiteSetting } from '@codeware/shared/util/payload-types';
import type { Payload, TypedLocale } from 'payload';

export type SiteSettingData = Pick<
  SiteSetting,
  'footer' | 'general' | 'tenant'
>;

/**
 * Ensure that a site setting exist with the given tenant.
 *
 * Update general and footer setting values when missing.
 *
 * @param payload - Payload instance
 * @param data - Site setting data
 * @param options - Seed options
 * @returns The site setting ID if exists or the object when created, otherwise undefined
 */
export async function ensureSiteSetting(
  payload: Payload,
  data: SiteSettingData,
  options: { locale: TypedLocale; transactionID: string | number | undefined }
): Promise<SiteSetting | number> {
  const { locale, transactionID } = options;
  const { footer: footerFromProps, general: generalFromProps, tenant } = data;

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
    const { footer, general, id } = siteSettings.docs[0];

    // Footer columns have database defaults, so a footer left untouched still
    // has values — seeded content is what tells the two apart
    const hasFooterContent = !!footer?.tagline || !!footer?.contact?.length;

    if (general.appName && general.landingPage && hasFooterContent) {
      return id;
    }

    // Update missing values
    await payload.update({
      collection: 'site-settings',
      id,
      data: {
        footer: {
          ...footer,
          contact: footer?.contact?.length
            ? footer.contact
            : footerFromProps?.contact,
          showVersion: footer?.showVersion ?? footerFromProps?.showVersion,
          tagline: footer?.tagline ?? footerFromProps?.tagline,
          variant: footer?.variant ?? footerFromProps?.variant
        },
        general: {
          ...general,
          appName: general.appName ?? generalFromProps.appName,
          icon: general.icon ?? generalFromProps.icon,
          landingPage: general.landingPage ?? generalFromProps.landingPage
        }
      },
      locale
    });

    return id;
  }

  // No site setting found, create one

  const newSiteSetting = await payload.create({
    collection: 'site-settings',
    data: {
      footer: footerFromProps,
      general: generalFromProps,
      tenant
    },
    locale,
    req: { transactionID }
  });

  return newSiteSetting;
}
