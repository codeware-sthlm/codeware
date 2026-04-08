import { getId } from '@codeware/app-cms/util/misc';
import type { FileAreaBlock } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

import { ensureNavigation } from './ensure-navigation';
import { ensurePage } from './ensure-page';

/**
 * Custom seed queries for documents that doesn't fit the generic seed data type.
 *
 * - Creates a file area page for tenants that have the 'file-area' tag
 *   and add this page to navigation.
 *
 * Runs without transaction to be able to use existing collection documents.
 * Everything else should be prepared before running this seed.
 *
 * @param payload - Payload instance
 * @param options - Seed options
 */
export const customSeed = async (
  payload: Payload,
  options: { transactionID: string | number | undefined }
): Promise<void> => {
  const { transactionID } = options;

  // Common file area slug for both tag and page
  const fileAreaSlug = 'file-area';

  // Create a file area page for tenants that have the 'file-area' tag
  const { docs } = await payload.find({
    collection: 'tags',
    select: { tenant: true },
    where: {
      and: [{ slug: { equals: fileAreaSlug } }, { tenant: { exists: true } }]
    },
    depth: 0,
    pagination: false,
    req: { transactionID }
  });
  for (const { id: tagId, tenant } of docs) {
    const tenantId = getId(tenant);

    // Get tenant default locale from site settings
    const { docs: siteSettingsDocs } = await payload.find({
      collection: 'site-settings',
      where: { tenant: { in: [tenantId] } },
      depth: 0,
      limit: 1,
      req: { transactionID }
    });
    const tenantLocale = siteSettingsDocs[0]?.general.defaultLocale;

    // Check if the page already exists
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: fileAreaSlug }, tenant: { in: [tenantId] } },
      depth: 0,
      limit: 1,
      req: { transactionID }
    });
    let pageId = docs.length ? docs[0]?.id : 0;

    // Create a file area page for the tenant when missing
    if (!pageId) {
      const pageOrId = await ensurePage(
        payload,
        {
          name: 'File area',
          slug: fileAreaSlug,
          layout: [
            {
              blockType: 'file-area',
              tags: [tagId],
              files: null
            } as FileAreaBlock
          ],
          tenant
        },
        { locale: tenantLocale, transactionID }
      );
      if (typeof pageOrId === 'object') {
        payload.logger.info(
          `[SEED] Page '${pageOrId.slug}' on tenant #${tenantId} (custom seed)`
        );
      }
      pageId = getId(pageOrId);
    }

    // Add the page to navigation when missing
    const { items } = await ensureNavigation(
      payload,
      {
        items: [{ reference: { relationTo: 'pages', value: pageId } }],
        tenant
      },
      { locale: tenantLocale, transactionID }
    );
    for (const { reference } of items) {
      const refId = getId(reference.value);
      payload.logger.info(
        `[SEED] Navigation to '${reference.relationTo}' #${refId} on tenant #${tenantId} (custom seed)`
      );
    }
  }
};
