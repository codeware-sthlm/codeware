import { getId } from '@codeware/app-cms/util/misc';
import type { Category } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type CategoryData = Pick<Category, 'name' | 'slug' | 'tenant'>;

/**
 * Ensure that a category exist with the given slug.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Category data
 * @returns The category ID if exists or created, otherwise undefined
 */
export async function ensureCategory(
  payload: Payload,
  transactionID: string | number | undefined,
  data: CategoryData
): Promise<Category | number> {
  const { name, slug, tenant } = data;

  // Check if the category exists with the given slug and tenant
  const categories = await payload.find({
    collection: 'categories',
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

  if (categories.totalDocs) {
    return categories.docs[0].id;
  }

  // No category found, create one

  const category = await payload.create({
    collection: 'categories',
    data: {
      name,
      slug,
      tenant
    },
    req: { transactionID }
  });

  return category;
}
