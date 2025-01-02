import type { Payload } from 'payload';
import type { TypeWithID } from 'payload/types';

import type { Page } from '../../generated/payload-types';
import { getId } from '../../utils/get-id';

export type PageData = Pick<
  Page,
  'header' | 'intro' | 'slug' | 'tenant' | 'title'
> & {
  slug: string;
};

const collection = 'pages';

/**
 * Ensure that a page exist with the given slug.
 *
 * @param payload - Payload instance
 * @param data - Page data
 * @returns The page ID if exists or created, otherwise undefined
 * @throws Never - just logs errors
 */
export async function ensurePage(
  payload: Payload,
  data: PageData
): Promise<TypeWithID['id'] | undefined> {
  try {
    const { header, slug, tenant, title } = data;

    // Check if the page exists with the given slug and tenant
    const pages = await payload.find({
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
      payload.logger.info(`[SEED] Skip: Page '${slug}' exist`);
      return pages.docs[0].id;
    }

    // No page found, create one

    const { id } = await payload.create({
      collection,
      data: {
        header,
        slug,
        tenant,
        title
      } satisfies Partial<Page>
    });

    payload.logger.info(
      `[SEED] Page '${slug}' was created ${tenant ? 'with' : 'without'} a tenant`
    );

    return id;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
