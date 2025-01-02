import type { Payload } from 'payload';
import type { TypeWithID } from 'payload/types';

import type { Article } from '../../generated/payload-types';

export type ArticleData = Pick<
  Article,
  'author' | 'slug' | 'tenant' | 'title'
> & {
  slug: string;
};

const collection = 'articles';

/**
 * Ensure that a article exist with the given slug.
 *
 * @param payload - Payload instance
 * @param data - Article data
 * @returns The article ID if exists or created, otherwise undefined
 * @throws Never - just logs errors
 */
export async function ensureArticle(
  payload: Payload,
  data: ArticleData
): Promise<TypeWithID['id'] | undefined> {
  try {
    const { author, slug, tenant, title } = data;

    // Check if the article exists with the given slug
    const articles = await payload.find({
      collection,
      where: {
        slug: { equals: slug }
      },
      depth: 0,
      limit: 1
    });

    if (articles.totalDocs) {
      payload.logger.info(`[SEED] Skip: Article '${slug}' exist`);
      return articles.docs[0].id;
    }

    // No article found, create one

    const { id } = await payload.create({
      collection,
      data: {
        author,
        slug,
        tenant,
        title
      } satisfies Partial<Article>
    });

    payload.logger.info(
      `[SEED] Article '${slug}' was created ${tenant ? 'with' : 'without'} a tenant`
    );

    return id;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
