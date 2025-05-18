import { capitalize } from '@codeware/shared/util/pure';
import { tailwind } from '@codeware/shared/util/tailwind';
import { randNumber } from '@ngneat/falso';

import { SeedData, SeedRules } from '../seed-types';

// Filter out black and white colors since they have no range
const colorNames = tailwind.names.filter(
  (name) => name.match(/black|white/) === null
);

// Return random Tailwind colors
const randColors = (length: number) =>
  Array.from(
    { length },
    () => colorNames[randNumber({ min: 0, max: colorNames.length - 1 })]
  );

/**
 * Generate tags seed data for tenants.
 */
export const generateTags = (
  range: NonNullable<SeedRules['tenantTags']>,
  tenants: SeedData['tenants']
): SeedData['tags'] => {
  return tenants.reduce(
    (tags, tenant) => {
      const length = randNumber({
        min: range.min,
        max: range.max
      });

      // Generate tags for tenant
      const tenantTags: SeedData['tags'] = randColors(length).map((name) => ({
        name: capitalize(name),
        slug: name,
        brand: {
          color: `${name}-500`,
          icon: 'TagIcon' // https://heroicons.com
        },
        tenant: { lookupApiKey: tenant.apiKey }
      }));
      tags.push(...tenantTags);

      return tags;
    },
    [] as SeedData['tags']
  );
};
