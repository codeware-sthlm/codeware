import { getId } from '@codeware/app-cms/util/misc';
import type { Payload } from 'payload';

import { ensureNavigation } from './ensure-navigation';
import { ensurePage } from './ensure-page';
import { ensureTourSignups } from './ensure-tour-signups';

/** Resolve a tenant's default locale from its site settings. */
const getTenantLocale = async (
  payload: Payload,
  tenantId: number,
  transactionID: string | number | undefined
) => {
  const { docs } = await payload.find({
    collection: 'site-settings',
    where: { tenant: { in: [tenantId] } },
    depth: 0,
    limit: 1,
    req: { transactionID }
  });
  return docs[0]?.general.defaultLocale;
};

/**
 * Custom seed queries for documents that doesn't fit the generic seed data type.
 *
 * - Creates a posts listing page for every tenant and adds it to navigation.
 * - Creates a tours listing page for tenants that have tours and adds this page
 *   to navigation.
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

    const tenantLocale = await getTenantLocale(
      payload,
      tenantId,
      transactionID
    );

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

  // TOURS LISTING PAGE
  // Create a tours listing page for tenants that have tours

  const { docs: tourDocs } = await payload.find({
    collection: 'tours',
    select: { intent: true, maxCustomers: true, tenant: true },
    where: { tenant: { exists: true } },
    depth: 0,
    pagination: false,
    req: { transactionID }
  });
  const tenantIdsWithTours = [
    ...new Set(tourDocs.map(({ tenant }) => getId(tenant)))
  ];

  for (const tenantId of tenantIdsWithTours) {
    const tenantLocale = await getTenantLocale(
      payload,
      tenantId,
      transactionID
    );

    const { title, description } = (() => {
      switch (tenantLocale) {
        case 'sv':
          return {
            title: 'Resor',
            description: 'Guidade resor med små sällskap och stora smaker.'
          };
        case 'en':
        default:
          return {
            title: 'Tours',
            description: 'Guided tours in small groups, with big flavours.'
          };
      }
    })();

    // Check if the page already exists
    const pageOrId = await ensurePage(
      payload,
      {
        name: title,
        slug: 'tours',
        layout: [
          {
            blockType: 'tours',
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

    // Add the page to navigation when missing
    const { items } = await ensureNavigation(
      payload,
      {
        items: [
          {
            reference: { relationTo: 'pages', value: getId(pageOrId) },
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

  // TOUR CAPACITY AND SIGNUPS
  // Give tours a maximum and a signup list, so the fill bar, the waiting queue
  // and the promote button all have something to show in development

  /** Locale per tenant, resolved once — the loop runs per tour */
  const localeByTenant = new Map<
    number,
    Awaited<ReturnType<typeof getTenantLocale>>
  >();

  for (const tour of tourDocs) {
    const tenantId = getId(tour.tenant);

    if (!localeByTenant.has(tenantId)) {
      localeByTenant.set(
        tenantId,
        await getTenantLocale(payload, tenantId, transactionID)
      );
    }
    const tenantLocale = localeByTenant.get(tenantId);

    if (!tour.maxCustomers) {
      await payload.update({
        collection: 'tours',
        id: tour.id,
        data: { maxCustomers: 12 },
        context: { seedAction: true },
        // Tours carry localized required fields. Without the tenant's own
        // locale the update lands on the default one, where those fields are
        // empty — and validation refuses a tour with no title.
        locale: tenantLocale,
        req: { transactionID }
      });
    }

    const created = await ensureTourSignups(
      payload,
      { tour: tour.id, tenant: tenantId },
      { transactionID }
    );

    if (created) {
      payload.logger.info(
        `[SEED] ${created} signups on tour #${tour.id} for tenant #${tenantId} (custom seed)`
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

    const tenantLocale = await getTenantLocale(
      payload,
      tenantId,
      transactionID
    );

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
