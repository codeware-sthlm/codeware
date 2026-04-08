/**
 * GET /api/tenant-config — endpoint security tests
 *
 * The endpoint is only available in CMS host mode. In tenant mode it returns 406.
 * When available, it requires a tenant API key caller — unauthenticated requests
 * and admin-session users are rejected with 403.
 *
 * E2E runs in tenant mode (TENANT_ID=moon), so all requests expect 406.
 */

import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';

/** Moon tenant API key from seed data (always present in e2e environment) */
const MOON_API_KEY = 'b9c2fb25-df77-4304-a60a-028779a2cb37';

test.describe('GET /api/tenant-config — tenant mode (e2e)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated request returns 406 in tenant mode', async ({
    request
  }) => {
    const res = await request.get('/api/tenant-config');
    expect(res.status()).toBe(406);
  });

  test('admin-session user returns 406 in tenant mode', async ({ page }) => {
    await loginAs(page, 'tenantAdmin', { navigate: false });
    const res = await page.request.get('/api/tenant-config');
    expect(res.status()).toBe(406);
  });

  test('system user session returns 406 in tenant mode', async ({ page }) => {
    await loginAs(page, 'systemUser', { navigate: false });
    const res = await page.request.get('/api/tenant-config');
    expect(res.status()).toBe(406);
  });

  test('valid tenant API key also returns 406 in tenant mode', async ({
    request
  }) => {
    // Even a valid API key is rejected — endpoint is not available in tenant mode
    const res = await request.get('/api/tenant-config', {
      headers: {
        Authorization: `tenants API-Key ${MOON_API_KEY}`
      }
    });
    expect(res.status()).toBe(406);
  });
});
