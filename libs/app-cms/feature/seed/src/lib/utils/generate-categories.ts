import { randNumber, randProductCategory } from '@ngneat/falso';

import { SeedData, SeedRules } from '../seed-types';

/**
 * Generate categories seed data for tenants.
 */
export const generateCategories = (
  range: NonNullable<SeedRules['tenantCategories']>,
  tenants: SeedData['tenants']
): SeedData['categories'] => {
  return tenants.reduce(
    (categories, tenant) => {
      const length = randNumber({
        min: range.min,
        max: range.max
      });

      // Generate categories for tenant
      const tenantCategories: SeedData['categories'] = randProductCategory({
        length
      }).map((name) => ({
        name,
        slug: name
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-]/g, '')
          // remove duplicate dashes
          .replace(/-+/g, '-')
          .toLowerCase(),
        tenant: { lookupApiKey: tenant.apiKey }
      }));
      categories.push(...tenantCategories);

      return categories;
    },
    [] as SeedData['categories']
  );
};
