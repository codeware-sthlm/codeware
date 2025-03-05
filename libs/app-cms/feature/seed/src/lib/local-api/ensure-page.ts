import { getId } from '@codeware/app-cms/util/functions';
import type { Page } from '@codeware/shared/util/payload-types';
import type { Payload, PayloadRequest } from 'payload';

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
 * @param req - Payload request with transaction ID when supported by the database
 * @param data - Page data
 * @returns The created page or the id if the page exists
 */
export async function ensurePage(
  payload: Payload,
  req: PayloadRequest,
  data: PageData
): Promise<Page | string | number> {
  const { header, layout, name, slug, tenant } = data;

  // Check if the page exists with the given slug and tenant
  const pages = await payload.find({
    req,
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: slug } },
        tenant ? { tenant: { in: [getId(tenant)] } } : {}
      ]
    },
    depth: 0,
    limit: 1
  });

  if (pages.totalDocs) {
    return pages.docs[0].id;
  }

  // No page found, create one

  const page = await payload.create({
    req,
    collection: 'pages',
    data: {
      header,
      layout,
      name,
      slug,
      tenant
    }
  });

  return page;
}
