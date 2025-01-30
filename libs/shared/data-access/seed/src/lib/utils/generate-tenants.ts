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
      const slug = name.split(/[\s,]/).at(0)?.toLowerCase();

      tenants.push({
        name,
        description: randSentence(),
        hosts: [`${slug}.localhost`, `cms.${slug}.localhost`],
        apiKey: apiKey
      });

      return tenants;
    },
    [] as SeedData['tenants']
  );
};
