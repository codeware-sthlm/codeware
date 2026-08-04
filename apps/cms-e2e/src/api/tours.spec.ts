/**
 * Tours — external client read contract
 *
 * The public site reads tours with a tenant api key and renders straight from
 * the populated response. Anything the key cannot read does not fail loudly —
 * a relationship it is denied comes back as a bare id, so the hero image or the
 * place icons simply disappear from the page. These assertions cover the depth
 * the renderer actually relies on.
 */

import { expect, test } from '../fixtures';

/** Moon tenant api key from seed data */
const MOON_API_KEY = 'b9c2fb25-df77-4304-a60a-028779a2cb37';

const apiKeyHeader = { Authorization: `tenants API-Key ${MOON_API_KEY}` };

type Populated = {
  heroImage?: { relationTo: string; value: unknown } | null;
  itinerary?: Array<{
    places?: Array<{ kind?: { icon?: string } | number } | number> | null;
  }> | null;
};

test.describe('Tours read contract', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('api key reads published tours', async ({ request }) => {
    const res = await request.get(
      '/api/tours?limit=100&depth=0&where[_status][equals]=published',
      { headers: apiKeyHeader }
    );
    expect(res.status()).toBe(200);
    expect((await res.json()).totalDocs).toBeGreaterThan(0);
  });

  test('hero image and place icons populate for an api key', async ({
    request
  }) => {
    // depth 2: tour -> itinerary place -> kind, which carries the chip icon
    const res = await request.get(
      '/api/tours?limit=100&depth=2&where[_status][equals]=published',
      { headers: apiKeyHeader }
    );
    expect(res.status()).toBe(200);

    const { docs } = (await res.json()) as { docs: Array<Populated> };
    expect(docs.length).toBeGreaterThan(0);

    // The hero is required, so every tour must resolve to a document
    for (const tour of docs) {
      expect(typeof tour.heroImage?.value, 'heroImage not populated').toBe(
        'object'
      );
    }

    const kinds = docs
      .flatMap((tour) => tour.itinerary ?? [])
      .flatMap((day) => day.places ?? [])
      .filter((place) => typeof place === 'object')
      .map((place) => place.kind);

    expect(kinds.length, 'no itinerary places to check').toBeGreaterThan(0);

    // A denied read on platform-labels leaves the id behind and the icon gone
    for (const kind of kinds) {
      expect(typeof kind, 'place kind not populated').toBe('object');
      expect((kind as { icon?: string }).icon).toBeTruthy();
    }
  });

  test('api key never sees draft tours', async ({ request }) => {
    const res = await request.get('/api/tours?limit=100&depth=0', {
      headers: apiKeyHeader
    });
    expect(res.status()).toBe(200);

    const { docs } = (await res.json()) as {
      docs: Array<{ _status?: string }>;
    };
    for (const tour of docs) {
      expect(tour._status).toBe('published');
    }
  });
});
