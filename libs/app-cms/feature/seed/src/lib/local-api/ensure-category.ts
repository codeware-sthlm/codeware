import { getId } from '@codeware/app-cms/util/functions';
import type { Category } from '@codeware/shared/util/payload-types';
import type { Payload, PayloadRequest } from 'payload';

export type CategoryData = Pick<Category, 'name' | 'slug' | 'tenant'>;

/**
 * Ensure that a category exist with the given slug.
 *
 * @param payload - Payload instance
 * @param req - Payload request with transaction ID when supported by the database
 * @param data - Category data
 * @returns The category ID if exists or created, otherwise undefined
 * @throws Never - just logs errors
 */
export async function ensureCategory(
  payload: Payload,
  req: PayloadRequest,
  data: CategoryData
): Promise<Category | string | number> {
  const { name, slug, tenant } = data;

  // Check if the category exists with the given slug and tenant
  const categories = await payload.find({
    req,
    collection: 'categories',
    where: {
      and: [
        { slug: { equals: slug } },
        tenant ? { tenant: { in: [getId(tenant)] } } : {}
      ]
    },
    depth: 0,
    limit: 1
  });

  if (categories.totalDocs) {
    return categories.docs[0].id;
  }

  // No category found, create one

  const category = await payload.create({
    req,
    collection: 'categories',
    data: {
      name,
      slug,
      tenant
    }
  });

  return category;
}
