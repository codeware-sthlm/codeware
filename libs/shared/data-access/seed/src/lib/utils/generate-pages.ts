import { randNumber, randQuote, randSports } from '@ngneat/falso';

import { SeedData, SeedRules } from '../seed-types';

/**
 * Generate pages seed data for tenants.
 */
export const generatePages = (
  range: NonNullable<SeedRules['tenantPages']>,
  tenants: SeedData['tenants']
): SeedData['pages'] => {
  return tenants.reduce(
    (pages, tenant) => {
      const length = randNumber({
        min: range.min,
        max: range.max
      });

      // Generate pages for tenant
      const tenantPages: SeedData['pages'] = randSports({ length }).map(
        (sport) => ({
          title: sport,
          header: randQuote(),
          slug: sport.replace(/\s+/g, '-').toLowerCase(),
          tenant: { lookupApiKey: tenant.apiKey }
        })
      );
      pages.push(...tenantPages);

      return pages;
    },
    [] as SeedData['pages']
  );
};
