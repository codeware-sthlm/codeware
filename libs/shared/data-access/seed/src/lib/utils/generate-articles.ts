import { randBook, randNumber } from '@ngneat/falso';

import { SeedData, SeedRules } from '../seed-types';

/**
 * Generate articles seed data for tenants.
 */
export const generateArticles = (
  range: NonNullable<SeedRules['tenantArticles']>,
  tenants: SeedData['tenants']
): SeedData['articles'] => {
  return tenants.reduce(
    (articles, tenant) => {
      const length = randNumber({
        min: range.min,
        max: range.max
      });

      // Generate articles for tenant
      const tenantArticles: SeedData['articles'] = randBook({ length }).map(
        ({ author, title }) => ({
          title,
          slug: title
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase(),
          author,
          tenant: { lookupApiKey: tenant.apiKey }
        })
      );

      articles.push(...tenantArticles);

      return articles;
    },
    [] as SeedData['articles']
  );
};
