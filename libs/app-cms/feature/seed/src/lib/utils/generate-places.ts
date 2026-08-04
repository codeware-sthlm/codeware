import { randCompanyName, randNumber } from '@ngneat/falso';

import { SeedData, SeedRules } from '../seed-types';

/**
 * Generate places seed data for tenants.
 */
export const generatePlaces = (
  range: NonNullable<SeedRules['tenantPlaces']>,
  tenants: SeedData['tenants']
): SeedData['places'] => {
  const kinds = ['winery', 'hotel', 'restaurant', 'activity'] as const;

  return tenants.reduce(
    (places, tenant) => {
      const length = randNumber({ min: range.min, max: range.max });

      const tenantPlaces: SeedData['places'] = Array.from(
        { length },
        (_, index) => {
          const name = `${randCompanyName()} ${index + 1}`;
          return {
            name,
            kind: kinds[index % kinds.length],
            url: `https://example.com/${name
              .replace(/\s+/g, '-')
              .replace(/[^a-zA-Z0-9-]/g, '')
              .toLowerCase()}`,
            tenant: { lookupApiKey: tenant.apiKey }
          };
        }
      );

      places.push(...tenantPlaces);

      return places;
    },
    [] as SeedData['places']
  );
};
