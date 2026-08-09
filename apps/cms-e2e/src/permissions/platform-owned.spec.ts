/**
 * Platform-owned collections — permission tests
 * Scenarios: [P-01] [P-02] [P-03] [P-04] [P-05] [P-06] from PERMISSIONS.md
 *
 * `faq`, `platform-labels` and `stock-media` belong to the platform rather
 * than a tenant and are deliberately not registered with the multi-tenant
 * plugin.
 * Every workspace reads the same documents; only system users maintain them.
 *
 * That shape is easy to get wrong. A tenant-scoped access helper here makes
 * Payload reject the query with "Cannot find field for path at tenant" — a 500
 * rather than a denial, which no cross-tenant assertion would notice. The plain
 * read assertions below are the regression guard.
 */

import { platformCollectionSlugs } from '@codeware/app-cms/util/definitions';

import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';
import { withSystemUser } from '../helpers/with-system-user';

/** Tenant API keys from seed data (always present in the e2e environment) */
const MOON_API_KEY = 'b9c2fb25-df77-4304-a60a-028779a2cb37';
const STAR_API_KEY = 'a76d0168-f9b2-48d2-bc57-96e45aaf8542';

const apiKeyHeader = (apiKey: string) => ({
  Authorization: `tenants API-Key ${apiKey}`
});

const collections = platformCollectionSlugs;

/** One document id per collection, collected once as the write target */
const docs: Record<string, number> = {};

test.describe('Platform-owned collections', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(async ({ browser }) => {
    await withSystemUser(browser, async (page) => {
      for (const slug of collections) {
        const res = await page.request.get(`/api/${slug}?limit=1&depth=0`);
        expect(res.status(), `GET /api/${slug}`).toBe(200);
        const { docs: found } = (await res.json()) as {
          docs: Array<{ id: number }>;
        };
        expect(found[0]?.id, `no seeded ${slug} document`).toBeTruthy();
        docs[slug] = found[0].id;
      }
    });
  });

  // -------------------------------------------------------------------------
  // [P-01] Read a platform-owned collection
  // -------------------------------------------------------------------------

  for (const user of ['tenantAdmin', 'tenantUser', 'systemUser'] as const) {
    test(`${user} can read platform-owned collections [P-01]`, async ({
      page
    }) => {
      await loginAs(page, user, { navigate: false });

      for (const slug of collections) {
        const res = await page.request.get(`/api/${slug}?limit=100&depth=0`);
        // A 500 here means the access control returned a tenant constraint
        // against a collection that has no tenant field
        expect(res.status(), `GET /api/${slug}`).toBe(200);
        expect(
          (await res.json()).totalDocs,
          `GET /api/${slug}`
        ).toBeGreaterThan(0);
      }
    });
  }

  // -------------------------------------------------------------------------
  // [P-02] Write to a platform-owned collection as an editor
  // -------------------------------------------------------------------------

  for (const user of ['tenantAdmin', 'tenantUser'] as const) {
    test(`${user} cannot write platform-owned collections [P-02]`, async ({
      page
    }) => {
      await loginAs(page, user, { navigate: false });

      for (const slug of collections) {
        const id = docs[slug];

        const update = await page.request.patch(`/api/${slug}/${id}`, {
          data: { name: 'editor write' }
        });
        expect([403, 404], `PATCH /api/${slug}/${id}`).toContain(
          update.status()
        );

        const remove = await page.request.delete(`/api/${slug}/${id}`);
        expect([403, 404], `DELETE /api/${slug}/${id}`).toContain(
          remove.status()
        );
      }

      const create = await page.request.post('/api/platform-labels', {
        data: {
          type: 'place-kind',
          name: `editor-${Date.now()}`,
          icon: 'MapPinIcon'
        }
      });
      expect([403, 404], 'POST /api/platform-labels').toContain(
        create.status()
      );
    });
  }

  // -------------------------------------------------------------------------
  // [P-03] Maintain a platform-owned collection as a system user
  // -------------------------------------------------------------------------

  test('system user can create, update and delete a platform label [P-03]', async ({
    page
  }) => {
    await loginAs(page, 'systemUser', { navigate: false });

    const create = await page.request.post('/api/platform-labels', {
      data: {
        type: 'place-kind',
        name: `e2e-kind-${Date.now()}`,
        icon: 'MapPinIcon'
      }
    });
    expect(create.status()).toBe(201);
    const { doc } = (await create.json()) as { doc: { id: number } };

    const update = await page.request.patch(`/api/platform-labels/${doc.id}`, {
      data: { icon: 'MapIcon' }
    });
    expect(update.status()).toBe(200);

    const remove = await page.request.delete(`/api/platform-labels/${doc.id}`);
    expect(remove.status()).toBe(200);
  });

  test('a platform label name must be unique within its type [P-03]', async ({
    page
  }) => {
    await loginAs(page, 'systemUser', { navigate: false });

    const name = `e2e-dup-${Date.now()}`;
    const body = { type: 'place-kind' as const, name, icon: 'MapPinIcon' };

    const first = await page.request.post('/api/platform-labels', {
      data: body
    });
    expect(first.status()).toBe(201);
    const { doc } = (await first.json()) as { doc: { id: number } };

    try {
      const duplicate = await page.request.post('/api/platform-labels', {
        data: body
      });
      expect(duplicate.status()).toBe(400);

      // The same name under a different type is a different vocabulary
      const other = await page.request.post('/api/platform-labels', {
        data: { ...body, type: 'stock-subject' }
      });
      expect(other.status()).toBe(201);

      const { doc: otherDoc } = (await other.json()) as {
        doc: { id: number };
      };
      await page.request.delete(`/api/platform-labels/${otherDoc.id}`);
    } finally {
      await page.request.delete(`/api/platform-labels/${doc.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // [P-04] Read a platform-owned collection with an api key
  // -------------------------------------------------------------------------

  for (const [label, apiKey] of [
    ['own', MOON_API_KEY],
    ['foreign', STAR_API_KEY]
  ] as const) {
    test(`${label} api key can read platform-owned collections [P-04]`, async ({
      request
    }) => {
      // Unlike tenant content, these are shared on purpose — a foreign key
      // reading them is the designed behaviour, not a leak
      for (const slug of collections) {
        const res = await request.get(`/api/${slug}?limit=100&depth=0`, {
          headers: apiKeyHeader(apiKey)
        });
        expect(res.status(), `GET /api/${slug}`).toBe(200);
        expect(
          (await res.json()).totalDocs,
          `GET /api/${slug}`
        ).toBeGreaterThan(0);
      }
    });

    // -----------------------------------------------------------------------
    // [P-05] Write to a platform-owned collection with an api key
    // -----------------------------------------------------------------------

    test(`${label} api key cannot write platform-owned collections [P-05]`, async ({
      request
    }) => {
      for (const slug of collections) {
        const id = docs[slug];

        const update = await request.patch(`/api/${slug}/${id}`, {
          headers: apiKeyHeader(apiKey),
          data: { name: 'api key write' }
        });
        expect([403, 404], `PATCH /api/${slug}/${id}`).toContain(
          update.status()
        );

        const remove = await request.delete(`/api/${slug}/${id}`, {
          headers: apiKeyHeader(apiKey)
        });
        expect([403, 404], `DELETE /api/${slug}/${id}`).toContain(
          remove.status()
        );
      }
    });
  }

  // -------------------------------------------------------------------------
  // [P-06] Reach a platform-owned collection unauthenticated
  // -------------------------------------------------------------------------

  test('anonymous cannot read platform-owned documents [P-06]', async ({
    request
  }) => {
    for (const slug of collections) {
      const res = await request.get(`/api/${slug}?limit=1&depth=0`);
      expect(res.status(), `GET /api/${slug}`).toBe(403);
    }
  });

  test('anonymous can fetch a stock media file [P-06]', async ({
    browser,
    request
  }) => {
    // Stock images are served on public tour pages, so the file itself has to
    // be reachable without a session even though its document is not
    const url = await withSystemUser(browser, async (page) => {
      const res = await page.request.get('/api/stock-media?limit=1&depth=0');
      expect(res.status()).toBe(200);
      const { docs: found } = (await res.json()) as {
        docs: Array<{ url?: string | null }>;
      };
      return found[0]?.url;
    });

    expect(url, 'seeded stock media has no url').toBeTruthy();

    const file = await request.get(url as string);
    expect(file.status(), `GET ${url}`).toBe(200);
  });
});
