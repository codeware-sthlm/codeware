/**
 * Draft mode — site visibility tests
 *
 * Verifies that draft pages are invisible to unauthenticated visitors,
 * become accessible in preview mode via /api/preview, and become publicly
 * visible once published.
 *
 * E2E runs in tenant mode (TENANT_ID=moon).
 */

import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';

const DRAFT_SLUG = `e2e-draft-page-${Date.now()}`;
let pageId: number;

test.describe('draft page visibility', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * Create a draft page in beforeAll so all tests can reference the same doc.
   * We open a temporary browser context logged in as tenantAdmin — this is the
   * standard beforeAll pattern used across the permissions tests.
   */
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();

    await loginAs(p, 'tenantAdmin');

    // Provide a minimal content block so the required `layout` field passes validation
    const res = await p.request.post('/api/pages', {
      data: {
        name: 'E2E Draft Page',
        slug: DRAFT_SLUG,
        layout: [{ blockType: 'content', columns: [] }],
        _status: 'draft'
      }
    });

    if (!res.ok()) {
      throw new Error(
        `Failed to create draft page: ${res.status()} ${await res.text()}`
      );
    }

    const body = await res.json();
    pageId = body.doc.id;

    await ctx.close();
  });

  test('draft page returns 404 for unauthenticated visitors', async ({
    page
  }) => {
    // No session cookies — unauthenticated request
    await page.goto(`/${DRAFT_SLUG}`);

    await expect(
      page.getByRole('heading', { name: 'Page not found' })
    ).toBeVisible();
  });

  test('draft page is accessible after enabling preview mode', async ({
    page
  }) => {
    await loginAs(page, 'tenantAdmin');

    // /api/preview enables draft mode and redirects to the given path
    const redirect = encodeURIComponent(`/${DRAFT_SLUG}`);
    const response = await page.goto(`/api/preview?redirect=${redirect}`);

    // Should follow the redirect and render the page (not 404)
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'Page not found' })
    ).toBeHidden();
  });

  test('published page is visible to unauthenticated visitors', async ({
    page
  }) => {
    await loginAs(page, 'tenantAdmin');

    // Publish the draft
    const res = await page.request.patch(`/api/pages/${pageId}`, {
      data: { _status: 'published' }
    });
    expect(res.status()).toBe(200);

    // Visit the page without any session or preview cookie
    await page.context().clearCookies();
    const response = await page.goto(`/${DRAFT_SLUG}`);

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'Page not found' })
    ).toBeHidden();
  });
});
