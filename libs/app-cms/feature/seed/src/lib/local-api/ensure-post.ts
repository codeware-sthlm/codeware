import type { Post } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type PostData = Pick<
  Post,
  'authors' | 'categories' | 'content' | 'tenant' | 'title'
> & {
  slug: string;
};

/**
 * Ensure that a post exist with the given slug.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Post data
 * @returns The created post or the id if the post exists
 */
export async function ensurePost(
  payload: Payload,
  transactionID: string | number | undefined,
  data: PostData
): Promise<Post | number> {
  const { authors, categories, content, slug, tenant, title } = data;

  // Check if the post exists with the given slug
  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug }
    },
    depth: 0,
    req: { transactionID },
    limit: 1
  });

  if (posts.totalDocs) {
    return posts.docs[0].id;
  }

  // No post found, create one

  const post = await payload.create({
    collection: 'posts',
    data: {
      authors,
      categories,
      content,
      slug,
      tenant,
      title
    },
    context: { seedAction: true },
    req: { transactionID }
  });

  return post;
}
