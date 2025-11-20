import { getId } from '@codeware/app-cms/util/misc';
import type { Tag } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type TagData = Pick<Tag, 'brand' | 'name' | 'slug' | 'tenant'> & {
  slug: string;
};

/**
 * Ensure that a tag exists with the given slug.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Tag data
 * @returns The created tag or the id if the tag exists
 */
export async function ensureTag(
  payload: Payload,
  transactionID: string | number | undefined,
  data: TagData
): Promise<Tag | number> {
  const { brand, name, slug, tenant } = data;

  // Check if the tag exists with the given slug and tenant
  const tags = await payload.find({
    collection: 'tags',
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

  if (tags.totalDocs) {
    return tags.docs[0].id;
  }

  // No tag found, create one

  const tag = await payload.create({
    collection: 'tags',
    data: {
      brand,
      name,
      slug,
      tenant
    },
    req: { transactionID }
  });

  return tag;
}
