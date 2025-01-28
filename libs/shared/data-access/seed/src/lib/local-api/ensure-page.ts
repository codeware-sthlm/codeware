import { type Page, getId } from '@codeware/shared/util/payload';
import type { Payload } from 'payload';
import { PayloadRequest } from 'payload/types';

export type PageData = Pick<
  Page,
  'content' | 'header' | 'name' | 'slug' | 'tenant'
> & {
  slug: string;
};

const collection = 'pages';

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
  const { content, header, name, slug, tenant } = data;

  // Check if the page exists with the given slug and tenant
  const pages = await payload.find({
    req,
    collection,
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
    collection,
    data: {
      content,
      header,
      name,
      slug,
      tenant
    } satisfies Partial<Page>
  });

  // TODO: Hopefully fixed in Payload 3
  return page as unknown as Page;
}
