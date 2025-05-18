import { getId } from '@codeware/app-cms/util/misc';
import type { Page } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type PageData = Pick<
  Page,
  'header' | 'layout' | 'name' | 'slug' | 'tenant'
> & {
  slug: string;
};

/**
 * Ensure that a page exist with the given slug.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Page data
 * @returns The created page or the id if the page exists
 */
export async function ensurePage(
  payload: Payload,
  transactionID: string | number | undefined,
  data: PageData
): Promise<Page | number> {
  const { header, layout, name, slug, tenant } = data;

  // Check if the page exists with the given slug and tenant
  const pages = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: slug } },
        tenant ? { tenant: { in: [getId(tenant)] } } : {}
      ]
    },
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (pages.totalDocs) {
    return pages.docs[0].id;
  }

  // No page found, create one

  const page = await payload.create({
    collection: 'pages',
    data: {
      header,
      layout,
      name,
      slug,
      tenant
    },
    req: { transactionID }
  });

  return page;
}
