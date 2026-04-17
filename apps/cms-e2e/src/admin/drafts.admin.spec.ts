/**
 * Admin UI — draft/versioning status column tests
 *
 * Verifies that the status column is visible in the pages and posts list views
 * after enabling versioning (drafts) on both collections.
 */

import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';

test.describe('/admin/collections — status column', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(
    async ({ page }) => await loginAs(page, 'tenantAdmin', { navigate: true })
  );

  test('pages list shows status column', async ({ page }) => {
    await page.goto('/admin/collections/pages');

    // The column header should be visible in the table
    await expect(
      page.getByRole('columnheader', { name: 'Status' })
    ).toBeVisible();
  });

  test('posts list shows status column', async ({ page }) => {
    await page.goto('/admin/collections/posts');

    await expect(
      page.getByRole('columnheader', { name: 'Status' })
    ).toBeVisible();
  });
});
