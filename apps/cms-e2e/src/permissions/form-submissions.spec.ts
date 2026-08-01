/**
 * Form submissions — tenant scope tests
 * Scenarios: [F-01] [F-02] from PERMISSIONS.md
 *
 * The form-builder plugin ships `read: ({ req: { user } }) => !!user` and leaves
 * delete at the Payload default, and the multi-tenant plugin only constrains
 * admin users. A tenant api key identity was therefore unscoped and could read
 * and delete every tenant's submissions (COD-425). Both operations now run
 * through `userOrApiKeyAccess`, like every other tenant enabled collection.
 *
 * E2E runs in moon tenant mode, where api key requests are not signature
 * verified — these tests cover the tenant constraint only.
 */

import type { Form } from '@codeware/shared/util/payload-types';

import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';

/** Tenant API keys from seed data (always present in the e2e environment) */
const MOON_API_KEY = 'b9c2fb25-df77-4304-a60a-028779a2cb37';
const STAR_API_KEY = 'a76d0168-f9b2-48d2-bc57-96e45aaf8542';

const apiKeyHeader = (apiKey: string) => ({
  Authorization: `tenants API-Key ${apiKey}`
});

/** Minimal Lexical value for the required confirmation message */
const confirmationMessage = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', text: 'Thanks!', version: 1 }]
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1
  }
};

test.describe('Form submissions — tenant scope', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /** Submission owned by moon, created through the site form route */
  let submissionId: number;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // The tenant is derived from the admin session, so the form lands in moon
      await loginAs(page, 'tenantAdmin', { navigate: false });

      const formRes = await page.request.post('/api/forms', {
        data: {
          title: `E2E Scope Form ${Date.now()}`,
          confirmationType: 'message',
          confirmationMessage,
          fields: [
            { blockType: 'email', name: 'email', label: 'Email', width: 6 }
          ]
        }
      });
      expect(formRes.status(), await formRes.text()).toBe(201);
      const { doc } = (await formRes.json()) as { doc: Form };

      // /api/form-submissions is a site route that authenticates as the
      // deployment's own tenant (moon), regardless of the caller
      const submissionRes = await page.request.post('/api/form-submissions', {
        data: {
          form: doc.id,
          submissionData: [{ field: 'email', value: 'moon@example.com' }]
        }
      });
      expect(submissionRes.status(), await submissionRes.text()).toBe(200);
      submissionId = (await submissionRes.json()).id;
    } finally {
      await context.close();
    }
  });

  // -------------------------------------------------------------------------
  // [F-01] Read a moon submission
  // -------------------------------------------------------------------------

  test('moon api key can read a moon submission [F-01]', async ({
    request
  }) => {
    const res = await request.get(`/api/form-submissions/${submissionId}`, {
      headers: apiKeyHeader(MOON_API_KEY)
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).id).toBe(submissionId);
  });

  test('star api key cannot read a moon submission [F-01]', async ({
    request
  }) => {
    const res = await request.get(`/api/form-submissions/${submissionId}`, {
      headers: apiKeyHeader(STAR_API_KEY)
    });
    expect([403, 404]).toContain(res.status());
  });

  test('unauthenticated request cannot read a submission [F-01]', async ({
    request
  }) => {
    const res = await request.get(`/api/form-submissions/${submissionId}`);
    expect([401, 403]).toContain(res.status());
  });

  // -------------------------------------------------------------------------
  // [F-02] Delete a moon submission
  // -------------------------------------------------------------------------

  test('star api key cannot delete a moon submission [F-02]', async ({
    request
  }) => {
    const res = await request.delete(`/api/form-submissions/${submissionId}`, {
      headers: apiKeyHeader(STAR_API_KEY)
    });
    expect([403, 404]).toContain(res.status());

    // The document must still be there for its owner
    const check = await request.get(`/api/form-submissions/${submissionId}`, {
      headers: apiKeyHeader(MOON_API_KEY)
    });
    expect(check.status()).toBe(200);
  });

  // Runs last — it removes the document the other scenarios rely on
  test('moon api key can delete a moon submission [F-02]', async ({
    request
  }) => {
    const res = await request.delete(`/api/form-submissions/${submissionId}`, {
      headers: apiKeyHeader(MOON_API_KEY)
    });
    expect(res.status()).toBe(200);
  });
});
