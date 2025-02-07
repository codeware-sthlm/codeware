import { randBook, randLine, randNumber } from '@ngneat/falso';

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
        ({ author, category, title }) => ({
          title,
          slug: title
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase(),
          author,
          content: `## ${title}
_By ${author}_
### ${category}
${randLine()}
${randLine()}
${randLine()}
`,
          tenant: { lookupApiKey: tenant.apiKey }
        })
      );

      articles.push(...tenantArticles);

      return articles;
    },
    [] as SeedData['articles']
  );
};
