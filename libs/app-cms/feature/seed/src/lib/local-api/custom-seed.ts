import { getId } from '@codeware/app-cms/util/misc';
import type { Payload } from 'payload';

import { ensureNavigation } from './ensure-navigation';
import { ensurePage } from './ensure-page';

/**
 * Custom seed queries for documents that doesn't fit the generic seed data type.
 *
 * - Creates a posts listing page for every tenant and adds it to navigation.
 * - Creates a file area page for tenants that have the 'file-area' tag
 *   and adds this page to navigation.
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

  // POSTS LISTING PAGE
  // Create a posts listing page for every tenant

  const { docs: allTenants } = await payload.find({
    collection: 'tenants',
    depth: 0,
    pagination: false,
    req: { transactionID }
  });

  for (const tenantDoc of allTenants) {
    const tenantId = tenantDoc.id;

    // Get tenant default locale from site settings
    const { docs: siteSettingsDocs } = await payload.find({
      collection: 'site-settings',
      where: { tenant: { in: [tenantId] } },
      depth: 0,
      limit: 1,
      req: { transactionID }
    });
    const tenantLocale = siteSettingsDocs[0]?.general.defaultLocale;

    const { title, description } = (() => {
      switch (tenantLocale) {
        case 'sv':
          return {
            title: 'Artiklar',
            description: 'Tankar om programmering, produktdesign och mer.'
          };
        case 'en':
        default:
          return {
            title: 'Articles',
            description: 'Thoughts on programming, product design, and more.'
          };
      }
    })();

    // Check if the page already exists
    const pageOrId = await ensurePage(
      payload,
      {
        name: 'Posts',
        slug: 'posts',
        layout: [
          {
            blockType: 'posts',
            title,
            description,
            limit: 10
          }
        ],
        tenant: tenantId
      },
      { locale: tenantLocale, transactionID }
    );

    if (typeof pageOrId === 'object') {
      payload.logger.info(
        `[SEED] Page '${pageOrId.slug}' on tenant #${tenantId} (custom seed)`
      );
    }

    const pageId = getId(pageOrId);

    // Add the page to navigation when missing
    const { items } = await ensureNavigation(
      payload,
      {
        items: [
          {
            reference: { relationTo: 'pages', value: pageId },
            labelSource: 'custom',
            customLabel: title
          }
        ],
        tenant: tenantId
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

  // FILE AREA PAGE
  // Create a file area page for tenants that have the 'file-area' tag

  const fileAreaSlug = 'file-area';

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

    const { name } = (() => {
      switch (tenantLocale) {
        case 'sv':
          return {
            name: 'Filområde'
          };
        case 'en':
        default:
          return {
            name: 'File area'
          };
      }
    })();

    // Create a file area page for the tenant when missing
    if (!pageId) {
      const pageOrId = await ensurePage(
        payload,
        {
          name,
          slug: fileAreaSlug,
          header: name,
          layout: [
            {
              blockType: 'file-area',
              tags: [tagId],
              files: null
            }
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
        items: [
          {
            reference: { relationTo: 'pages', value: pageId },
            labelSource: 'custom',
            customLabel: name
          }
        ],
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
