/**
 * /api/preview and /api/preview/exit — draft mode route tests
 *
 * E2E runs in tenant mode (TENANT_ID=moon).
 *
 * /api/preview enables Next.js draft mode after verifying the Payload session,
 * then redirects to the given path.
 * /api/preview/exit disables draft mode and redirects to the given path.
 */

import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';

test.describe('GET /api/preview', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('returns 400 when redirect param is missing', async ({ request }) => {
    const res = await request.get('/api/preview');
    expect(res.status()).toBe(400);
  });

  test('returns 400 when redirect is not a relative path', async ({
    request
  }) => {
    const res = await request.get(
      '/api/preview?redirect=https://evil.example.com'
    );
    expect(res.status()).toBe(400);
  });

  test('returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.get('/api/preview?redirect=/');
    expect(res.status()).toBe(401);
  });

  test('sets draft mode cookie and redirects when authenticated', async ({
    page
  }) => {
    await loginAs(page, 'tenantAdmin', { navigate: false });

    // Follow the redirect and check we land on the home page
    const response = await page.goto('/api/preview?redirect=/');
    expect(response?.status()).toBe(200);

    // Draft mode sets the __prerender_bypass cookie
    const cookies = await page.context().cookies();
    const bypassCookie = cookies.find((c) => c.name === '__prerender_bypass');
    expect(bypassCookie).toBeDefined();
  });
});

test.describe('GET /api/preview/exit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('clears draft mode cookie and redirects', async ({ page }) => {
    await loginAs(page, 'tenantAdmin', { navigate: false });

    // Enable draft mode first
    await page.goto('/api/preview?redirect=/');
    const cookiesBefore = await page.context().cookies();
    expect(
      cookiesBefore.find((c) => c.name === '__prerender_bypass')
    ).toBeDefined();

    // Exit draft mode
    const response = await page.goto('/api/preview/exit?redirect=/');
    expect(response?.status()).toBe(200);

    // The bypass cookie should be gone or expired
    const cookiesAfter = await page.context().cookies();
    const bypassCookie = cookiesAfter.find(
      (c) => c.name === '__prerender_bypass'
    );
    expect(bypassCookie).toBeUndefined();
  });
});
