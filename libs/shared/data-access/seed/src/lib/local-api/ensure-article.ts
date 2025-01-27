import type { Article } from '@codeware/shared/util/payload';
import type { Payload } from 'payload';
import { PayloadRequest } from 'payload/types';

export type ArticleData = Pick<
  Article,
  'author' | 'content' | 'slug' | 'tenant' | 'title'
> & {
  slug: string;
};

const collection = 'articles';

/**
 * Ensure that a article exist with the given slug.
 *
 * @param payload - Payload instance
 * @param req - Payload request with transaction ID when supported by the database
 * @param data - Article data
 * @returns The created article or the id if the article exists
 */
export async function ensureArticle(
  payload: Payload,
  req: PayloadRequest,
  data: ArticleData
): Promise<Article | string | number> {
  const { author, content, slug, tenant, title } = data;

  // Check if the article exists with the given slug
  const articles = await payload.find({
    req,
    collection,
    where: {
      slug: { equals: slug }
    },
    depth: 0,
    limit: 1
  });

  if (articles.totalDocs) {
    return articles.docs[0].id;
  }

  // No article found, create one

  const article = await payload.create({
    req,
    collection,
    data: {
      author,
      content,
      slug,
      tenant,
      title
    } satisfies Partial<Article>
  });

  // TODO: Hopefully fixed in Payload 3
  return article as unknown as Article;
}
