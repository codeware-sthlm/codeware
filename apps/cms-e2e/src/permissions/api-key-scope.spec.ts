/**
 * Tenant API key scope — permission tests
 * Scenarios: [K-01] [K-02] [K-03] [K-04] from PERMISSIONS.md
 *
 * The multi-tenant plugin only constrains identities from the users collection,
 * so a tenant api key is exactly as scoped as a collection's own access control
 * makes it. Where a collection left an operation to the Payload default, any key
 * reached every tenant (COD-425).
 *
 * `moon` is the deployment's own tenant, `star` a foreign one. Denials are
 * asserted for both: the key must be read-only even within its own tenant.
 */

import { expect, test } from '../fixtures';
import { createForm } from '../helpers/create-form';
import { loginAs } from '../helpers/login';

/** Tenant API keys from seed data (always present in the e2e environment) */
const MOON_API_KEY = 'b9c2fb25-df77-4304-a60a-028779a2cb37';
const STAR_API_KEY = 'a76d0168-f9b2-48d2-bc57-96e45aaf8542';

const apiKeyHeader = (apiKey: string) => ({
  Authorization: `tenants API-Key ${apiKey}`
});

/**
 * Collections to probe, with the query that picks a suitable target document.
 *
 * Draft-enabled collections need a published document — api key clients never
 * see drafts, which would make the positive read control fail for the right
 * reason and hide a wrong one.
 */
const collections = [
  { slug: 'pages', query: '&where[_status][equals]=published' },
  { slug: 'posts', query: '&where[_status][equals]=published' },
  { slug: 'tours', query: '&where[_status][equals]=published' },
  { slug: 'places', query: '' },
  { slug: 'media', query: '' },
  { slug: 'categories', query: '' },
  { slug: 'tags', query: '' },
  { slug: 'navigation', query: '' },
  { slug: 'site-settings', query: '' }
];

/** Moon document ids collected once, used as the attack targets */
const moonDocs: Record<string, number> = {};

test.describe('Tenant API key scope', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAs(page, 'tenantAdmin', { navigate: false });

      // Everything the admin session can read here belongs to moon — in tenant
      // mode the server scopes all reads to the active tenant
      for (const { slug, query } of collections) {
        const res = await page.request.get(
          `/api/${slug}?limit=1&depth=0${query}`
        );
        expect(res.status(), `GET /api/${slug}`).toBe(200);
        const { docs } = (await res.json()) as { docs: Array<{ id: number }> };
        expect(docs[0]?.id, `no seeded ${slug} document`).toBeTruthy();
        moonDocs[slug] = docs[0].id;
      }

      const form = await createForm(page, `E2E Key Scope Form ${Date.now()}`);
      moonDocs['forms'] = form.id;
    } finally {
      await context.close();
    }
  });

  // -------------------------------------------------------------------------
  // [K-01] Read another tenant's content
  // -------------------------------------------------------------------------

  test('foreign api key cannot read moon documents [K-01]', async ({
    request
  }) => {
    for (const [slug, id] of Object.entries(moonDocs)) {
      const res = await request.get(`/api/${slug}/${id}`, {
        headers: apiKeyHeader(STAR_API_KEY)
      });
      expect([403, 404], `GET /api/${slug}/${id}`).toContain(res.status());
    }
  });

  test('foreign api key sees no moon documents in list results [K-01]', async ({
    request
  }) => {
    for (const [slug, id] of Object.entries(moonDocs)) {
      const res = await request.get(`/api/${slug}?limit=100&depth=0`, {
        headers: apiKeyHeader(STAR_API_KEY)
      });
      expect(res.status(), `GET /api/${slug}`).toBe(200);

      const { docs } = (await res.json()) as { docs: Array<{ id: number }> };
      expect(
        docs.map((doc) => doc.id),
        `GET /api/${slug}`
      ).not.toContain(id);
    }
  });

  test('own api key can read its own documents [K-01]', async ({ request }) => {
    for (const [slug, id] of Object.entries(moonDocs)) {
      const res = await request.get(`/api/${slug}/${id}`, {
        headers: apiKeyHeader(MOON_API_KEY)
      });
      expect(res.status(), `GET /api/${slug}/${id}`).toBe(200);
    }
  });

  // -------------------------------------------------------------------------
  // [K-02] Write with an api key
  // -------------------------------------------------------------------------

  for (const [label, apiKey] of [
    ['own', MOON_API_KEY],
    ['foreign', STAR_API_KEY]
  ] as const) {
    test(`${label} api key cannot update moon documents [K-02]`, async ({
      request
    }) => {
      for (const [slug, id] of Object.entries(moonDocs)) {
        const res = await request.patch(`/api/${slug}/${id}`, {
          headers: apiKeyHeader(apiKey),
          data: {}
        });
        expect([403, 404], `PATCH /api/${slug}/${id}`).toContain(res.status());
      }
    });

    test(`${label} api key cannot delete moon documents [K-02]`, async ({
      request
    }) => {
      for (const [slug, id] of Object.entries(moonDocs)) {
        const res = await request.delete(`/api/${slug}/${id}`, {
          headers: apiKeyHeader(apiKey)
        });
        expect([403, 404], `DELETE /api/${slug}/${id}`).toContain(res.status());
      }
    });

    test(`${label} api key cannot create documents [K-02]`, async ({
      request
    }) => {
      const res = await request.post('/api/forms', {
        headers: apiKeyHeader(apiKey),
        data: { title: `Injected ${Date.now()}` }
      });
      expect([400, 403]).toContain(res.status());
    });
  }

  // -------------------------------------------------------------------------
  // [K-03] Read users with an api key
  // -------------------------------------------------------------------------

  test('api key cannot read users [K-03]', async ({ request }) => {
    const res = await request.get('/api/users?limit=100', {
      headers: apiKeyHeader(MOON_API_KEY)
    });
    expect(res.status()).toBe(403);
  });

  test('api key cannot read tenants [K-03]', async ({ request }) => {
    // Tenant documents carry the api keys of every other tenant
    const res = await request.get('/api/tenants?limit=100', {
      headers: apiKeyHeader(MOON_API_KEY)
    });
    expect(res.status()).toBe(403);
  });

  // -------------------------------------------------------------------------
  // [K-04] Read version history with an api key
  // -------------------------------------------------------------------------

  test('api key cannot read version history [K-04]', async ({ request }) => {
    // Versions hold unpublished drafts, which clients must never reach
    for (const slug of ['pages', 'posts', 'tours']) {
      const res = await request.get(`/api/${slug}/versions?limit=100`, {
        headers: apiKeyHeader(MOON_API_KEY)
      });
      expect(res.status(), `GET /api/${slug}/versions`).toBe(403);
    }
  });
});
