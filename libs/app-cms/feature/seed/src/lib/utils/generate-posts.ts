import type { CategoryLookup, UserLookup } from '@codeware/shared/util/seed';
import { randBook, randJobTitle, randLine, randNumber } from '@ngneat/falso';

import { SeedData, SeedRules } from '../seed-types';

/**
 * Generate posts seed data for tenants.
 */
export const generatePosts = (
  range: NonNullable<SeedRules['tenantPosts']>,
  categories: SeedData['categories'],
  tenants: SeedData['tenants'],
  users: SeedData['users']
): SeedData['posts'] => {
  return tenants.reduce(
    (posts, tenant) => {
      const length = randNumber({
        min: range.min,
        max: range.max
      });

      // Pick one of the tenant categories
      const tenantCategories: Array<CategoryLookup> = categories
        .filter((category) => category.tenant.lookupApiKey === tenant.apiKey)
        .map(({ slug }) => ({ lookupSlug: slug }));
      const category =
        tenantCategories[randNumber({ max: tenantCategories.length - 1 })];

      // Pick one of the tenant users
      const tenantUsers: Array<UserLookup> = users
        .filter((user) =>
          user.tenants.some((t) => t.lookupApiKey === tenant.apiKey)
        )
        .map(({ email }) => ({ lookupEmail: email }));
      const user = tenantUsers[randNumber({ max: tenantUsers.length - 1 })];

      // Generate posts for tenant
      const tenantPosts: SeedData['posts'] = randBook({ length }).map(
        ({ title }) => ({
          title,
          slug: title
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase(),
          authors: [user],
          categories: [category],
          content: `# ${title}
${randLine()}
${randLine()}
## ${randJobTitle()}
${randLine()}
`,
          tenant: { lookupApiKey: tenant.apiKey }
        })
      );

      posts.push(...tenantPosts);

      return posts;
    },
    [] as SeedData['posts']
  );
};
