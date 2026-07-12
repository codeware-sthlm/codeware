/**
 * Admin UI — custom dashboard (root /admin view)
 *
 * The dashboard is a server component that fetches all its data through the
 * refactored data-access layer (`getCollectionCounts`, `getPages`, `getPosts`,
 * `getPreference` via an authenticated `mapToRuntime(payload, user)` runtime).
 * These tests verify it renders end-to-end for an admin user — if any of those
 * data calls threw, the view would error and the cards/tabs would not appear.
 */

import { expect, test } from '../fixtures';
import { loginAs } from '../helpers/login';

test.describe('/admin — dashboard', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(
    async ({ page }) => await loginAs(page, 'tenantAdmin', { navigate: true })
  );

  test('renders the dashboard with Home and All content tabs', async ({
    page
  }) => {
    await page.goto('/admin');

    // Scoped to role=tab so it never collides with the sidebar nav "Home" link.
    await expect(page.getByRole('tab', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'All content' })).toBeVisible();
  });

  test('All content tab lists collection cards with counts', async ({
    page
  }) => {
    await page.goto('/admin');

    await page.getByRole('tab', { name: 'All content' }).click();

    // Scope to the active tab panel so card links don't collide with the
    // sidebar nav links of the same name.
    const panel = page.getByRole('tabpanel');

    await expect(panel.getByRole('link', { name: 'Pages' })).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Posts' })).toBeVisible();

    // Each card footer renders the collection count as "{n} items" — proves
    // getCollectionCounts resolved and the counts reached the client.
    await expect(panel.getByText(/\d+ items/).first()).toBeVisible();
  });
});
