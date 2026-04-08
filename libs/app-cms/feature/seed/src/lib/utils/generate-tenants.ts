import {
  randCompanyName,
  randNumber,
  randSentence,
  randUuid
} from '@ngneat/falso';

import type { SeedData, SeedRules } from '../seed-types';

/**
 * Generate tenants seed data.
 */
export const generateTenants = (
  range: NonNullable<SeedRules['tenants']>
): SeedData['tenants'] => {
  return randUuid({
    length: randNumber({ min: range.min, max: range.max })
  }).reduce(
    (tenants, apiKey) => {
      const name = randCompanyName();
      const slug = name.toLowerCase().replace(/\s+/g, '-');

      tenants.push({
        name,
        slug,
        description: randSentence(),
        apiKey: apiKey,
        locale: 'en',
        supportedLocales: ['en', 'sv']
      });

      return tenants;
    },
    [] as SeedData['tenants']
  );
};
