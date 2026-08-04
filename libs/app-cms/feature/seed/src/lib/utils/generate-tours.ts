import { randCity, randCountry, randLine, randNumber } from '@ngneat/falso';

import { SeedData, SeedRules } from '../seed-types';

/**
 * Generate tours seed data for tenants.
 */
export const generateTours = (
  range: NonNullable<SeedRules['tenantTours']>,
  tenants: SeedData['tenants']
): SeedData['tours'] => {
  return tenants.reduce(
    (tours, tenant) => {
      const length = randNumber({
        min: range.min,
        max: range.max
      });

      const tenantTours: SeedData['tours'] = Array.from(
        { length },
        (_, index) => {
          const city = randCity();
          const days = randNumber({ min: 3, max: 10 });
          const title = `${city} Discovery`;

          // Spread departures across the season, booking closing two months before
          const departure = new Date(2027, 3 + index, 8 + index);
          const deadline = new Date(departure);
          deadline.setMonth(deadline.getMonth() - 2);

          return {
            title,
            slug: `${city}-discovery-${index + 1}`
              .replace(/\s+/g, '-')
              .replace(/[^a-zA-Z0-9-]/g, '')
              .toLowerCase(),
            summary: randLine(),
            destination: `${city}, ${randCountry()}`,
            duration: `${days} days`,
            price: randNumber({ min: 8, max: 40 }) * 100,
            currency: 'EUR' as const,
            intent: 'booking' as const,
            departureDate: departure.toISOString().slice(0, 10),
            bookingDeadline: deadline.toISOString().slice(0, 10),
            heroImage: 'stock-rivervalley-1.jpg',
            included: ['All transfers', 'Accommodation', 'Guide throughout'],
            notIncluded: ['Flights', 'Lunches', 'Travel insurance'],
            itinerary: Array.from({ length: days }, (_, day) => ({
              title: `Day ${day + 1}`,
              description: randLine()
            })),
            content: `## What's included
${randLine()}

## Good to know
${randLine()}
`,
            tenant: { lookupApiKey: tenant.apiKey }
          };
        }
      );

      tours.push(...tenantTours);

      return tours;
    },
    [] as SeedData['tours']
  );
};
